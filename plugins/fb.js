/**
 * NovaX Mini — Facebook Downloader Plugin
 *
 * BUGS FIXED:
 *   1. sendErr previously called errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', text) treating it as a
 *      string formatter. errMsg is async(conn, from, mek, text) — NOT a string
 *      formatter. Calling it that way embeds [object Promise] in the message text.
 *      Fix: removed errMsg import entirely; sendErr now uses a self-contained
 *      inline template identical to tiktokdl.js and song.js.
 *
 * Architecture:
 *   .fb  <url>   — fetch info + interactive quality selection menu
 *   .fbhd <url>  — download & send HD quality directly
 *   .fbsd <url>  — download & send SD quality directly
 *
 *   Three API providers are tried in sequence (movanest → fdown.net → arslan).
 *   If all fail the user receives a clean error message.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { cmd }           = require('../NovaX_Mini');
const config            = require('../config');
const axios             = require('axios');
const { sendInteractive, qr, url } = require('../lib/interactive');
const logger            = require('../lib/logger');

// ── Error helper (self-contained, matches song.js / tiktokdl.js style) ───────
const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(
        from,
        { text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ${text}\n╰━━━━━━━━━━━━━━━┈` },
        { quoted: mek }
    );

// ── Constants ─────────────────────────────────────────────────────────────────
const AXIOS_CFG = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

/**
 * Detect whether a string looks like a Facebook URL.
 * Covers: facebook.com, www.facebook.com, m.facebook.com,
 *         fb.watch, fb.me, l.facebook.com (redirect links)
 */
const isFbUrl = (u) =>
    typeof u === 'string' &&
    /(?:(?:www\.|m\.|l\.)?facebook\.com|fb\.watch|fb\.me)/i.test(u);

// ── API Providers (fallback chain) ────────────────────────────────────────────

/**
 * Provider 1: movanest.xyz
 */
async function tryMovanest(fbUrl) {
    const res = await axios.get(
        `https://movanest.xyz/v2/fbdown?url=${encodeURIComponent(fbUrl)}`,
        AXIOS_CFG
    );
    const d = res.data;
    if (d.status !== true || !Array.isArray(d.results) || !d.results.length)
        throw new Error('No results from movanest');
    const r = d.results[0];
    return {
        title:     (r.title             || 'Facebook Video').trim(),
        thumbnail: r.thumbnail          || config.IMAGE_PATH,
        duration:  r.duration           || 'N/A',
        hd:        r.hdQualityLink      || null,
        sd:        r.normalQualityLink  || null
    };
}

/**
 * Provider 2: fdown.net
 */
async function tryFdownNet(fbUrl) {
    const res = await axios.get(
        `https://fdown.net/api/get?url=${encodeURIComponent(fbUrl)}`,
        AXIOS_CFG
    );
    const d = res.data;
    if (!d || (!d.hd && !d.sd && !d.links))
        throw new Error('No results from fdown.net');
    return {
        title:     (d.title              || 'Facebook Video').trim(),
        thumbnail: d.thumb || d.thumbnail || config.IMAGE_PATH,
        duration:  d.duration             || 'N/A',
        hd:        d.hd   || (d.links && d.links['HD']) || null,
        sd:        d.sd   || (d.links && d.links['SD']) || null
    };
}

/**
 * Provider 3: arslan-apis-v2
 */
async function tryArslanApi(fbUrl) {
    const res = await axios.get(
        `https://arslan-apis-v2.vercel.app/download/facebook?url=${encodeURIComponent(fbUrl)}`,
        AXIOS_CFG
    );
    const d = res.data;
    if (!d || !d.status)
        throw new Error('No results from arslan api');
    const r = d.result || {};
    return {
        title:     (r.title     || 'Facebook Video').trim(),
        thumbnail: r.thumbnail  || config.IMAGE_PATH,
        duration:  r.duration   || 'N/A',
        hd:        r.hd || r.HD || null,
        sd:        r.sd || r.SD || null
    };
}

// ── Core downloader (tries all providers in sequence) ────────────────────────

async function downloadFacebook(fbUrl) {
    const providers = [
        { name: 'movanest',   fn: tryMovanest  },
        { name: 'fdown.net',  fn: tryFdownNet  },
        { name: 'arslan-api', fn: tryArslanApi }
    ];

    let lastErr;
    for (const { name, fn } of providers) {
        try {
            logger.info(`[FB] Trying provider: ${name}`);
            const result = await fn(fbUrl);
            logger.info(`[FB] Provider ${name} succeeded — title: "${result.title}"`);
            return result;
        } catch (e) {
            logger.warn(`[FB] Provider ${name} failed: ${e.message}`);
            lastErr = e;
        }
    }
    throw lastErr || new Error('All Facebook download APIs failed.');
}

// ── Interactive preview card ───────────────────────────────────────────────────

async function sendPreview(conn, mek, from, data, fbUrl) {
    const prefix     = config.PREFIX || '.';
    const shortTitle = data.title.length > 55
        ? data.title.substring(0, 55) + '…'
        : data.title;

    const qualityLine = [
        data.hd ? 'HD ✅' : null,
        data.sd ? 'SD ✅' : null
    ].filter(Boolean).join('  |  ') || 'N/A';

    const body =
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ★*

 🎬 *Title:* ${shortTitle}
 ⏱️ *Duration:* ${data.duration}
 📺 *Quality:* ${qualityLine}

 ────────────────────────
 📥 *Select your preferred quality below:*`;

    const buttons = [
        data.hd ? qr('🎥 HD Quality', `${prefix}fbhd ${fbUrl}`) : null,
        data.sd ? qr('📱 SD Quality', `${prefix}fbsd ${fbUrl}`) : null,
        url('🔗 Open Facebook', fbUrl)
    ].filter(Boolean);

    await sendInteractive(conn, from, mek, {
        imageUrl: data.thumbnail,
        title:    '📘 NovaX Mini',
        body,
        footer:   config.BOT_FOOTER,
        buttons
    });
}

// ── Video sender ──────────────────────────────────────────────────────────────

async function downloadVideo(conn, mek, from, fbUrl, quality) {
    try {
        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        logger.info(`[FB] Downloading ${quality.toUpperCase()} — ${fbUrl}`);

        const data = await downloadFacebook(fbUrl);
        const videoUrl = quality === 'hd'
            ? (data.hd || data.sd)
            : (data.sd || data.hd);

        if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
            throw new Error('Requested quality not available.');
        }

        const shortTitle = data.title.length > 50
            ? data.title.substring(0, 50) + '…'
            : data.title;

        logger.info(`[FB] Sending video — quality: ${quality.toUpperCase()}, title: "${shortTitle}"`);

        await conn.sendMessage(from, {
            video:    { url: videoUrl },
            mimetype: 'video/mp4',
            caption:
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ★*

 🎬 *${shortTitle}*
 ⏱️ *Duration:* ${data.duration}
 📺 *Quality:* ${quality.toUpperCase()}

> ${config.BOT_FOOTER}`,
            contextInfo: {
                externalAdReply: {
                    title:                 shortTitle,
                    body:                  `⏱️ ${data.duration} • ɴᴏᴠᴀ-x ᴍɪɴɪ`,
                    thumbnailUrl:          data.thumbnail,
                    sourceUrl:             fbUrl,
                    mediaType:             1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        logger.info(`[FB] Video sent successfully.`);

    } catch (err) {
        logger.error(`[FB] downloadVideo error — quality: ${quality} | ${err.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await sendErr(conn, mek, from,
            'Facebook video download failed. The video may be private or the API is temporarily offline.'
        );
    }
}

// ── COMMAND: .fb <url> ────────────────────────────────────────────────────────

cmd({
    pattern:  'fb',
    alias:    ['facebook', 'fbdl', 'fbvideo'],
    react:    '📘',
    desc:     'Download Facebook video',
    category: 'download',
    use:      '.fb <facebook url>',
    filename: __filename
}, async (conn, mek, m, { q }) => {
    const from   = mek.key.remoteJid;
    const prefix = config.PREFIX || '.';

    // No URL provided — show usage card
    if (!q) {
        return sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            title:    '📘 NovaX Mini',
            body:
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ★*

 ℹ️ *Usage:* ${prefix}fb <facebook url>

 ─────────────────────────
 *Supported:*
 • Standard Facebook videos
 • Facebook Reels
 • Facebook Watch videos
 • fb.watch short links
 • fb.me short links

 ⚠️ *Note:* Only public videos can be downloaded.`,
            footer:  config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }

    // Validate URL
    if (!isFbUrl(q)) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from,
            'Invalid URL. Please send a valid *facebook.com*, *fb.watch*, or *fb.me* link.'
        );
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        logger.info(`[FB] Preview requested — url: ${q}`);

        const data = await downloadFacebook(q);

        // Validate we got at least one quality link
        if (!data.hd && !data.sd) {
            throw new Error('No downloadable video links found in API response.');
        }

        await sendPreview(conn, from, mek, data, q);

    } catch (err) {
        logger.error(`[FB] Preview error: ${err.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });

        // Give the user a contextual error message
        let errText;
        if (/private/i.test(err.message)) {
            errText = 'This video is *private*. Only public Facebook videos can be downloaded.';
        } else if (/not found/i.test(err.message)) {
            errText = 'Video *not found*. Please check the URL and try again.';
        } else if (/timeout|ECONNRESET|network/i.test(err.message)) {
            errText = 'Request timed out. Please try again in a moment.';
        } else {
            errText = 'Failed to fetch Facebook video. Please try again later.';
        }

        await sendErr(conn, mek, from, errText);
    }
});

// ── COMMAND: .fbhd <url> ──────────────────────────────────────────────────────

cmd({
    pattern:            'fbhd',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    if (!q || !isFbUrl(q)) {
        return sendErr(conn, mek, from, 'Invalid Facebook URL. Use `.fb <url>` first.');
    }
    await downloadVideo(conn, mek, from, q, 'hd');
});

// ── COMMAND: .fbsd <url> ──────────────────────────────────────────────────────

cmd({
    pattern:            'fbsd',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    if (!q || !isFbUrl(q)) {
        return sendErr(conn, mek, from, 'Invalid Facebook URL. Use `.fb <url>` first.');
    }
    await downloadVideo(conn, mek, from, q, 'sd');
});
