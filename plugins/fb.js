const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url, errMsg } = require('../lib/interactive');

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', text) }, { quoted: mek });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AXIOS_CFG = {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
};

const isFbUrl = (u) => /facebook\.com|fb\.watch|fb\.me/i.test(u);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API PROVIDERS (fallback chain)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        title:     r.title             || 'Facebook Video',
        thumbnail: r.thumbnail         || config.IMAGE_PATH,
        duration:  r.duration          || 'N/A',
        hd:        r.hdQualityLink     || null,
        sd:        r.normalQualityLink || null
    };
}

async function tryFdownNet(fbUrl) {
    const res = await axios.get(
        `https://fdown.net/api/get?url=${encodeURIComponent(fbUrl)}`,
        AXIOS_CFG
    );
    const d = res.data;
    if (!d || (!d.hd && !d.sd && !d.links)) throw new Error('No results from fdown.net');
    return {
        title:     d.title     || 'Facebook Video',
        thumbnail: d.thumb || d.thumbnail || config.IMAGE_PATH,
        duration:  d.duration  || 'N/A',
        hd:        d.hd || (d.links && d.links['HD'])   || null,
        sd:        d.sd || (d.links && d.links['SD'])   || null
    };
}

async function tryArslanApi(fbUrl) {
    const res = await axios.get(
        `https://arslan-apis-v2.vercel.app/download/facebook?url=${encodeURIComponent(fbUrl)}`,
        AXIOS_CFG
    );
    const d = res.data;
    if (!d || !d.status) throw new Error('No results from arslan api');
    const r = d.result || {};
    return {
        title:     r.title     || 'Facebook Video',
        thumbnail: r.thumbnail || config.IMAGE_PATH,
        duration:  r.duration  || 'N/A',
        hd:        r.hd || r.HD || null,
        sd:        r.sd || r.SD || null
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOWNLOAD FACEBOOK (with fallback)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadFacebook(fbUrl) {
    const providers = [tryMovanest, tryFdownNet, tryArslanApi];
    let lastErr;
    for (const provider of providers) {
        try {
            return await provider(fbUrl);
        } catch (e) {
            console.warn(`[FB DL] Provider failed: ${e.message}`);
            lastErr = e;
        }
    }
    throw lastErr || new Error('All Facebook download APIs failed.');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEND PREVIEW (interactive)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendPreview(conn, mek, from, data, fbUrl) {
    const prefix = config.PREFIX || '.';
    const shortTitle = data.title.length > 55
        ? data.title.substring(0, 55) + '…'
        : data.title;

    const body =
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ★*

 🎬 *Title:* ${shortTitle}
 ⏱️ *Duration:* ${data.duration}
 📺 *Quality:* ${[data.hd && 'HD ✅', data.sd && 'SD ✅'].filter(Boolean).join('  |  ')}

 ────────────────────────
 📥 *Select your preferred quality below:*`;

    const buttons = [
        data.hd ? qr('🎥 HD Quality', `${prefix}fbhd ${fbUrl}`) : null,
        data.sd ? qr('📱 SD Quality', `${prefix}fbsd ${fbUrl}`) : null,
        url('🔗 Open Facebook', fbUrl)
    ].filter(Boolean);

    await sendInteractive(conn, from, mek, {
        imageUrl: data.thumbnail,   // ← correct key for interactive.js
        title:    '📘 NovaX Mini',
        body,
        footer:   config.BOT_FOOTER,
        buttons
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOWNLOAD VIDEO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadVideo(conn, mek, from, fbUrl, quality) {
    try {
        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        const data = await downloadFacebook(fbUrl);
        const videoUrl = quality === 'hd'
            ? (data.hd || data.sd)
            : (data.sd || data.hd);

        if (!videoUrl) throw new Error('Requested quality not available.');

        const shortTitle = data.title.length > 50
            ? data.title.substring(0, 50) + '…'
            : data.title;

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

    } catch (err) {
        console.error('[FB DL] downloadVideo error:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await sendErr(conn, mek, from, 'Facebook video download failed. The video may be private or the API is offline.');
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: .fb <url>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
    pattern:  'fb',
    alias:    ['facebook', 'fbdl', 'fbvideo'],
    react:    '📘',
    desc:     'Download Facebook video',
    category: 'download',
    use:      '.fb <facebook url>',
    filename: __filename
}, async (conn,  mek,  m, { q, body, text }) => {
    const from = mek.key.remoteJid;
    const prefix = config.PREFIX || '.';

    if (!q) {
        return sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            title:    '📘 NovaX Mini',
            body:
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ★*

 ℹ️ *Usage:* .fb <facebook url>

 ─────────────────────────
 *Supported:*
 • Facebook Videos
 • Facebook Reels
 • Facebook Watch
 • Public Videos Only`,
            footer:  config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }

    if (!isFbUrl(q)) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, 'Invalid URL. Please send a valid facebook.com, fb.watch, or fb.me link.');
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const data = await downloadFacebook(q);
        await sendPreview(conn, from, mek, data, q);

    } catch (err) {
        console.error('[FB DL] Preview error:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        const errText = /private/i.test(err.message)
            ? 'This video is private. Only public Facebook videos can be downloaded.'
            : /not found/i.test(err.message)
                ? 'Video not found. Please check the URL and try again.'
                : 'Failed to fetch Facebook video. Please try again later.';
        await sendErr(conn, mek, from, errText);
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: .fbhd <url>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
    pattern:            'fbhd',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    if (!q || !isFbUrl(q))
        return sendErr(conn, mek, from, 'Invalid Facebook URL.');
    await downloadVideo(conn, mek, from, q, 'hd');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: .fbsd <url>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
    pattern:            'fbsd',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    if (!q || !isFbUrl(q))
        return sendErr(conn, mek, from, 'Invalid Facebook URL.');
    await downloadVideo(conn, mek, from, q, 'sd');
});
