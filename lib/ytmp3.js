/**
 * NovaX Mini — YouTube MP3 Download Helper (Fixed)
 *
 * BUGS FIXED:
 *   1. denethdev-ytmp3 returns { downloadUrl } NOT { url } — was always throwing
 *      "API returned no download link" even on success.
 *   2. checkProgress() had an infinite while(true) loop with no timeout.
 *   3. No fallback when primary provider was down.
 *   4. No temp-file download — now downloads to disk before sending.
 *
 * Architecture:
 *   downloadAudio(youtubeUrl) → tries Provider A (denethdev-ytmp3 via oceansaver)
 *                             → falls back to Provider B (cobalt.tools API)
 *                             → returns { downloadUrl, title, thumbnail, duration }
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const Ddownr = require('denethdev-ytmp3');
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// ── Constants ─────────────────────────────────────────────────────────────────
const PROVIDER_TIMEOUT_MS   = 25000;  // 25 s per provider
const POLLING_TIMEOUT_MS    = 90000;  // 90 s total polling budget
const POLLING_INTERVAL_MS   = 2000;   // 2 s between polls
const MAX_FILE_SIZE_BYTES   = 60 * 1024 * 1024;  // 60 MB
const TEMP_DIR              = path.join(process.cwd(), 'temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    try { fs.mkdirSync(TEMP_DIR, { recursive: true }); } catch (_) {}
}

// ── Helper: promise with timeout ─────────────────────────────────────────────
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[ytmp3] ${label} timed out after ${ms}ms`)), ms)
        )
    ]);
}

// ── Helper: download URL to temp file ────────────────────────────────────────
/**
 * Downloads a remote URL to a local temp file.
 * Validates content type and size.
 * @param {string} remoteUrl
 * @param {string} [ext='mp3']
 * @returns {Promise<string>} local file path
 */
async function downloadToTempFile(remoteUrl, ext = 'mp3') {
    const fileName = `novax_audio_${uuidv4()}.${ext}`;
    const filePath = path.join(TEMP_DIR, fileName);

    logger.info(`[ytmp3] Downloading to temp file: ${fileName}`);

    const response = await withTimeout(
        axios({
            method: 'GET',
            url: remoteUrl,
            responseType: 'stream',
            timeout: PROVIDER_TIMEOUT_MS,
            maxContentLength: MAX_FILE_SIZE_BYTES,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
            }
        }),
        PROVIDER_TIMEOUT_MS,
        'file download'
    );

    // Check content type — reject HTML error pages
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
        throw new Error('Received HTML instead of audio file — provider may be down.');
    }

    // Check content length if available
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${Math.round(contentLength / 1024 / 1024)}MB (max 60MB)`);
    }

    // Write to disk
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

    // Validate written file
    const stat = fs.statSync(filePath);
    if (stat.size < 1024) {
        fs.unlinkSync(filePath);
        throw new Error('Downloaded file is too small — likely an error page or empty response.');
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
            logger.info(`[ytmp3] Cleaned up temp file: ${path.basename(filePath)}`);
        }
    } catch (e) {
        logger.warn(`[ytmp3] Could not clean temp file: ${e.message}`);
    }
}

// ── Provider A: denethdev-ytmp3 (oceansaver.in) ───────────────────────────────
/**
 * Download using the denethdev-ytmp3 package.
 * FIX: result.downloadUrl (not result.url) is the correct key.
 * FIX: polling now has a hard timeout instead of infinite while(true).
 *
 * @param {string} youtubeUrl
 * @returns {Promise<{downloadUrl, title, thumbnail, tempFile}>}
 */
async function providerA(youtubeUrl) {
    logger.info('[ytmp3:A] Trying oceansaver provider...');

    const ddownr = new Ddownr();

    // The package's download() internally calls checkProgress with a while(true).
    // We wrap it with a hard timeout to prevent hanging.
    const result = await withTimeout(
        ddownr.download(youtubeUrl, 'mp3'),
        POLLING_TIMEOUT_MS,
        'Provider A (oceansaver) polling'
    );

    // FIX: The actual key is `downloadUrl`, NOT `url`
    // Normalise both to handle any future upstream changes
    const resolvedUrl = result.downloadUrl || result.download_url || result.url || result.link;

    if (!resolvedUrl || typeof resolvedUrl !== 'string' || !resolvedUrl.startsWith('http')) {
        logger.warn('[ytmp3:A] Result object:', JSON.stringify(result));
        throw new Error('Provider A returned no valid download URL.');
    }

    logger.info(`[ytmp3:A] Got download URL (title: ${result.title || 'unknown'})`);

    // Download to temp file
    const tempFile = await downloadToTempFile(resolvedUrl, 'mp3');

    return {
        downloadUrl: resolvedUrl,
        title:       result.title     || 'Unknown Song',
        thumbnail:   result.image     || result.thumbnail || null,
        duration:    result.duration  || null,
        tempFile
    };
}

// ── Provider B: cobalt.tools (open source API, no key needed) ────────────────
/**
 * Fallback provider using the public cobalt.tools API.
 * cobalt.tools accepts YouTube URLs and returns a direct audio stream.
 *
 * @param {string} youtubeUrl
 * @returns {Promise<{downloadUrl, title, thumbnail, tempFile}>}
 */
async function providerB(youtubeUrl) {
    logger.info('[ytmp3:B] Trying cobalt.tools fallback provider...');

    const response = await withTimeout(
        axios.post(
            'https://api.cobalt.tools/api/json',
            {
                url: youtubeUrl,
                vCodec: 'h264',
                vQuality: '720',
                aFormat: 'mp3',
                isAudioOnly: true,
                isNoTTWatermark: true,
                dubLang: false
            },
            {
                timeout: PROVIDER_TIMEOUT_MS,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'NovaXMini/3.0 (WhatsApp Bot)'
                }
            }
        ),
        PROVIDER_TIMEOUT_MS,
        'Provider B (cobalt.tools) request'
    );

    const data = response.data;

    if (!data || (data.status !== 'stream' && data.status !== 'redirect' && data.status !== 'success')) {
        throw new Error(`Provider B returned status: ${data?.status || 'unknown'}`);
    }

    const resolvedUrl = data.url;
    if (!resolvedUrl) throw new Error('Provider B returned no URL.');

    logger.info('[ytmp3:B] Got cobalt stream URL.');

    const tempFile = await downloadToTempFile(resolvedUrl, 'mp3');

    return {
        downloadUrl: resolvedUrl,
        title:       data.filename?.replace(/\.[^.]+$/, '') || 'Unknown Song',
        thumbnail:   null,
        duration:    null,
        tempFile
    };
}

// ── Main exported function ─────────────────────────────────────────────────────

/**
 * Download audio from a YouTube URL.
 * Tries Provider A first; falls back to Provider B on failure.
 *
 * @param {string} youtubeUrl  Full YouTube video URL
 * @returns {Promise<{downloadUrl, title, thumbnail, duration, tempFile}>}
 *   tempFile: absolute path to the downloaded mp3 on disk (caller MUST delete after use)
 */
async function downloadAudio(youtubeUrl) {
    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
        throw new Error('Invalid YouTube URL provided.');
    }

    // Sanitise URL
    const url = youtubeUrl.trim();

    let lastError = null;

    // ── Provider A ──────────────────────────────────────────────────────────
    try {
        return await providerA(url);
    } catch (errA) {
        lastError = errA;
        logger.warn(`[ytmp3] Provider A failed: ${errA.message}`);
    }

    // ── Provider B ──────────────────────────────────────────────────────────
    try {
        return await providerB(url);
    } catch (errB) {
        lastError = errB;
        logger.warn(`[ytmp3] Provider B failed: ${errB.message}`);
    }

    // Both failed
    throw new Error(`All audio download providers failed. Last error: ${lastError?.message || 'unknown'}`);
}

/**
 * Cleanup helper — call this in finally blocks after sending.
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
