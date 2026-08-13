/**
 * NovaX Mini — YouTube MP3 Download Helper
 *
 * Provider chain (tried in order):
 *   A — denethdev-ytmp3  (oceansaver.in)   — fast when up
 *   B — loader.to API    (progress-based)  — confirmed working 2025-08
 *   C — cobalt community instance          — last resort
 *
 * BUGS FIXED vs previous version:
 *   - Provider B was api.cobalt.tools which now requires bot-protection /
 *     Turnstile auth and returns HTTP 400 for all programmatic requests.
 *     Replaced with loader.to which works without any API key.
 *   - oceansaver.in DNS occasionally fails (ENOTFOUND) — Provider A now
 *     catches that gracefully and falls through to Provider B.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

// denethdev-ytmp3 exports a pre-constructed instance, not the class itself.
// Using `new Ddownr()` throws "Ddownr is not a constructor".
const ddownrInstance = require('denethdev-ytmp3');
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// ── Constants ─────────────────────────────────────────────────────────────────
const PROVIDER_TIMEOUT_MS  = 25000;   // 25 s per HTTP request
const POLLING_TIMEOUT_MS   = 90000;   // 90 s total for provider A polling
const POLLING_INTERVAL_MS  = 3000;    // 3 s between loader.to progress polls
const POLLING_MAX_ATTEMPTS = 20;      // 20 × 3 s = 60 s max polling
const MAX_FILE_SIZE_BYTES  = 60 * 1024 * 1024;  // 60 MB
const TEMP_DIR             = path.join(process.cwd(), 'temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    try { fs.mkdirSync(TEMP_DIR, { recursive: true }); } catch (_) {}
}

// ── Common headers ────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── Helper: promise with timeout ──────────────────────────────────────────────
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[ytmp3] ${label} timed out after ${ms}ms`)), ms)
        )
    ]);
}

// ── Helper: sleep ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Helper: download remote URL to temp file ──────────────────────────────────
async function downloadToTempFile(remoteUrl, ext = 'mp3') {
    const fileName = `novax_audio_${uuidv4()}.${ext}`;
    const filePath = path.join(TEMP_DIR, fileName);

    logger.info(`[ytmp3] Downloading to temp: ${fileName}`);

    const response = await withTimeout(
        axios({
            method:  'GET',
            url:     remoteUrl,
            responseType: 'stream',
            timeout: PROVIDER_TIMEOUT_MS,
            maxContentLength: MAX_FILE_SIZE_BYTES,
            headers: { 'User-Agent': UA }
        }),
        PROVIDER_TIMEOUT_MS,
        'file download'
    );

    // Reject HTML error pages
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
        throw new Error('Received HTML instead of audio — provider returned an error page.');
    }

    // Check declared content length
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${Math.round(contentLength / 1024 / 1024)}MB (max 60MB)`);
    }

    // Stream to disk
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        let bytesWritten = 0;

        response.data.on('data', chunk => {
            bytesWritten += chunk.length;
            if (bytesWritten > MAX_FILE_SIZE_BYTES) {
                writer.destroy();
                reject(new Error('Download exceeded 60MB limit mid-stream.'));
            }
        });

        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('error', reject);
    });

    // Validate the written file
    const stat = fs.statSync(filePath);
    if (stat.size < 1024) {
        fs.unlinkSync(filePath);
        throw new Error('Downloaded file is too small — likely an error response, not audio.');
    }

    logger.info(`[ytmp3] Temp file ready: ${fileName} (${Math.round(stat.size / 1024)}KB)`);
    return filePath;
}

// ── Helper: cleanup temp file ─────────────────────────────────────────────────
function cleanupTempFile(filePath) {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`[ytmp3] Cleaned: ${path.basename(filePath)}`);
        }
    } catch (e) {
        logger.warn(`[ytmp3] Could not clean temp file: ${e.message}`);
    }
}

// ── Provider A: denethdev-ytmp3 (oceansaver.in) ───────────────────────────────
async function providerA(youtubeUrl) {
    logger.info('[ytmp3:A] Trying oceansaver (denethdev-ytmp3)...');

    // ddownrInstance is the pre-built instance exported by the package.
    const result = await withTimeout(
        ddownrInstance.download(youtubeUrl, 'mp3'),
        POLLING_TIMEOUT_MS,
        'Provider A (oceansaver) polling'
    );

    // Normalise possible key names
    const resolvedUrl = result.downloadUrl || result.download_url || result.url || result.link;

    if (!resolvedUrl || typeof resolvedUrl !== 'string' || !resolvedUrl.startsWith('http')) {
        logger.warn('[ytmp3:A] No valid URL in result:', JSON.stringify(result));
        throw new Error('Provider A returned no valid download URL.');
    }

    logger.info(`[ytmp3:A] Success — title: "${result.title || 'unknown'}"`);

    const tempFile = await downloadToTempFile(resolvedUrl, 'mp3');
    return {
        downloadUrl: resolvedUrl,
        title:       result.title     || 'Unknown Song',
        thumbnail:   result.image     || result.thumbnail || null,
        duration:    result.duration  || null,
        tempFile
    };
}

// ── Provider B: loader.to (progress-polling, confirmed working 2025-08) ───────
/**
 * loader.to works in two steps:
 *   1. GET /ajax/download.php?format=mp3&url=<ytUrl>
 *      → returns { success, id, progress_url, title, thumbnail_url, ... }
 *   2. GET <progress_url> every few seconds
 *      → polls until progress=1000 (done) and download_url is non-empty
 *
 * No API key required. Free public service.
 */
async function providerB(youtubeUrl) {
    logger.info('[ytmp3:B] Trying loader.to...');

    // Step 1: initiate download
    const initRes = await withTimeout(
        axios.get(
            `https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(youtubeUrl)}`,
            { timeout: PROVIDER_TIMEOUT_MS, headers: { 'User-Agent': UA } }
        ),
        PROVIDER_TIMEOUT_MS,
        'Provider B (loader.to) init'
    );

    const init = initRes.data;
    if (!init || !init.success || !init.progress_url) {
        throw new Error(`Provider B init failed: ${JSON.stringify(init).substring(0, 200)}`);
    }

    const title     = init.title      || init.info?.title  || 'Unknown Song';
    const thumbnail = init.thumbnail_url || init.info?.image || null;

    logger.info(`[ytmp3:B] Init OK — title: "${title}" | polling: ${init.progress_url}`);

    // Step 2: poll for download_url
    let downloadUrl = null;
    for (let i = 0; i < POLLING_MAX_ATTEMPTS; i++) {
        await sleep(POLLING_INTERVAL_MS);

        const pollRes = await withTimeout(
            axios.get(init.progress_url, {
                timeout: PROVIDER_TIMEOUT_MS,
                headers: { 'User-Agent': UA }
            }),
            PROVIDER_TIMEOUT_MS,
            `Provider B poll #${i + 1}`
        );

        const poll = pollRes.data;
        logger.info(`[ytmp3:B] Poll ${i + 1}/${POLLING_MAX_ATTEMPTS} — progress: ${poll?.progress}, success: ${poll?.success}`);

        if (poll && poll.success === 1 && poll.download_url) {
            downloadUrl = poll.download_url;
            break;
        }

        // If progress stuck or error
        if (poll && poll.success === 0 && poll.progress === 0) {
            throw new Error('Provider B reported error during processing.');
        }
    }

    if (!downloadUrl) {
        throw new Error('Provider B timed out — download_url never became available.');
    }

    logger.info(`[ytmp3:B] Got download URL.`);

    const tempFile = await downloadToTempFile(downloadUrl, 'mp3');
    return {
        downloadUrl,
        title,
        thumbnail,
        duration: null,
        tempFile
    };
}

// ── Provider C: cobalt community instance (last resort) ───────────────────────
/**
 * Uses a public cobalt community instance that does NOT require auth.
 * NOTE: api.cobalt.tools is bot-protected (returns 400). We use a
 * community instance instead.
 */
async function providerC(youtubeUrl) {
    logger.info('[ytmp3:C] Trying cobalt community instance...');

    // List of known open community instances (no auth required)
    // These are checked in order; first one to succeed is used.
    const instances = [
        'https://cobalt.api.timelessnesses.me',
        'https://co.wuk.sh',
        'https://cobalt.synzr.space'
    ];

    let lastErr;
    for (const base of instances) {
        try {
            const response = await withTimeout(
                axios.post(
                    `${base}/`,
                    { url: youtubeUrl, downloadMode: 'audio', audioFormat: 'mp3' },
                    {
                        timeout: PROVIDER_TIMEOUT_MS,
                        headers: {
                            'Accept':       'application/json',
                            'Content-Type': 'application/json',
                            'User-Agent':   UA
                        }
                    }
                ),
                PROVIDER_TIMEOUT_MS,
                `Provider C (${base})`
            );

            const data = response.data;
            if (!data) throw new Error('Empty response');

            const status = data.status;
            if (status !== 'tunnel' && status !== 'redirect' && status !== 'stream') {
                throw new Error(`Unexpected status: ${status}`);
            }

            const resolvedUrl = data.url;
            if (!resolvedUrl) throw new Error('No URL in cobalt response.');

            logger.info(`[ytmp3:C] Got stream URL from ${base}`);

            const tempFile = await downloadToTempFile(resolvedUrl, 'mp3');
            return {
                downloadUrl: resolvedUrl,
                title:       data.filename?.replace(/\.[^.]+$/, '') || 'Unknown Song',
                thumbnail:   null,
                duration:    null,
                tempFile
            };

        } catch (e) {
            logger.warn(`[ytmp3:C] Instance ${base} failed: ${e.message}`);
            lastErr = e;
        }
    }

    throw lastErr || new Error('All cobalt community instances failed.');
}

// ── Main exported function ─────────────────────────────────────────────────────

/**
 * Download audio from a YouTube URL.
 * Tries Provider A → B → C in order, returns on first success.
 *
 * @param {string} youtubeUrl
 * @returns {Promise<{ downloadUrl, title, thumbnail, duration, tempFile }>}
 *   Caller MUST call cleanupAudio(result) in a finally block.
 */
async function downloadAudio(youtubeUrl) {
    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
        throw new Error('Invalid YouTube URL provided.');
    }

    const url = youtubeUrl.trim();

    // Provider A
    try {
        return await providerA(url);
    } catch (errA) {
        logger.warn(`[ytmp3] Provider A failed: ${errA.message}`);
    }

    // Provider B
    try {
        return await providerB(url);
    } catch (errB) {
        logger.warn(`[ytmp3] Provider B failed: ${errB.message}`);
    }

    // Provider C
    try {
        return await providerC(url);
    } catch (errC) {
        logger.warn(`[ytmp3] Provider C failed: ${errC.message}`);
        throw new Error(`All audio download providers failed. Last error: ${errC.message}`);
    }
}

/**
 * Cleanup helper — always call in finally blocks.
 * @param {{ tempFile?: string }|null} result
 */
function cleanupAudio(result) {
    if (result && result.tempFile) {
        cleanupTempFile(result.tempFile);
    }
}

module.exports = {
    downloadAudio,
    cleanupAudio,
    downloadToTempFile,
    cleanupTempFile,
    TEMP_DIR
};
