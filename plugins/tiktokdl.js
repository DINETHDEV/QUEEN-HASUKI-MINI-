const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url, errMsg } = require('../lib/interactive');
const { getUserLanguage } = require('../lib/database');
const { getLang } = require('../lib/lang');

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ${text}\n╰━━━━━━━━━━━━━━━┈` }, { quoted: mek });

// ── Per-language TikTok strings ─────────────────────────────────────────────────
const TIKTOK_STRINGS = {
    en: {
        USAGE:         '❌ Please provide a valid TikTok URL.\nUsage: .tiktok <URL>',
        DOWNLOADER:    'TikTok Downloader',
        TITLE_LABEL:   'Title',
        AUTHOR_LABEL:  'Author',
        LIKES_LABEL:   'Likes',
        COMMENTS_LABEL:'Comments',
        SHARES_LABEL:  'Shares',
        DURATION_LABEL:'Duration',
        SELECT_FORMAT: 'Select download option:',
        HD_BTN:        '🎬 HD Video',
        SD_BTN:        '🎬 SD Video',
        WM_BTN:        '🎬 Watermark Video',
        AUDIO_BTN:     '🎵 Audio (MP3)',
        OPEN_BTN:      '▶️ Open URL',
        FAILED:        '❌ TikTok download failed. Please try again.',
    },
    si: {
        USAGE:         '❌ කරුණාකර නිවැරදි TikTok URL එකක් ලබා දෙන්න.\nඋදාහරණ: .tiktok <URL>',
        DOWNLOADER:    'TikTok බාගත කිරීම',
        TITLE_LABEL:   'මාතෘකාව',
        AUTHOR_LABEL:  'කර්තෘ',
        LIKES_LABEL:   'මනාප (Likes)',
        COMMENTS_LABEL:'අදහස් (Comments)',
        SHARES_LABEL:  'බෙදාගැනීම්',
        DURATION_LABEL:'කාලසීමාව',
        SELECT_FORMAT: 'බාගත කිරීමේ ක්‍රමය තෝරන්න:',
        HD_BTN:        '🎬 HD වීඩියෝව',
        SD_BTN:        '🎬 SD වීඩියෝව',
        WM_BTN:        '🎬 ලකුණ සහිත වීඩියෝව',
        AUDIO_BTN:     '🎵 ශ්‍රව්‍ය (MP3)',
        OPEN_BTN:      '▶️ සබැඳිය විවෘත කරන්න',
        FAILED:        '❌ TikTok බාගත කිරීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.',
    }
};

/**
 * Get TikTok string for a language, falling back to English.
 * @param {string} lang  Language code
 * @param {string} key   String key
 */
function tt(lang, key) {
    const map = TIKTOK_STRINGS[(lang || 'en').toLowerCase()] || TIKTOK_STRINGS.en;
    return map[key] || TIKTOK_STRINGS.en[key] || key;
}

// ==============================
// HELPER FUNCTIONS
// ==============================

async function downloadTikTok(urlStr) {
    const apis = [
        `https://tikwm.com/api/?url=${encodeURIComponent(urlStr)}&hd=1`,
        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(urlStr)}`
    ];

    for (const api of apis) {
        try {
            const res = await axios.get(api, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (res.data && res.data.code === 0 && res.data.data) {
                return res.data.data;
            }
            if (res.data && res.data.video) {
                return {
                    title: res.data.title || "TikTok Video",
                    author: { nickname: res.data.author?.name || "Unknown" },
                    cover: res.data.video.cover || config.IMAGE_PATH,
                    play: res.data.video.noWatermark,
                    wmplay: res.data.video.watermark,
                    hdplay: res.data.video.noWatermark,
                    music: res.data.music?.play_url,
                    duration: res.data.video.duration || 0,
                    play_count: res.data.stats?.playCount || 0,
                    digg_count: res.data.stats?.likeCount || 0,
                    comment_count: res.data.stats?.commentCount || 0,
                    share_count: res.data.stats?.shareCount || 0
                };
            }
        } catch (err) {
            console.error(`API Failed: ${api}`, err.message);
        }
    }
    throw new Error("All TikTok APIs failed or URL is invalid.");
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

async function handleTikTokAction(conn, mek, from, q, actionType) {
    if (!q) return sendErr(conn, mek, from, 'Please provide a TikTok URL.');

    try {
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        const data = await downloadTikTok(q);

        let mediaUrl = "";
        let mimetype = "video/mp4";
        let typeKey = "video";

        if (actionType === "hd") {
            mediaUrl = data.hdplay || data.play;
        } else if (actionType === "sd") {
            mediaUrl = data.play || data.hdplay;
        } else if (actionType === "wm") {
            mediaUrl = data.wmplay || data.play;
        } else if (actionType === "audio") {
            mediaUrl = data.music;
            mimetype = "audio/mpeg";
            typeKey = "audio";
        }

        if (!mediaUrl) {
            throw new Error("Requested media type not found.");
        }

        const responseData = await axios.get(mediaUrl, { responseType: 'arraybuffer', timeout: 60000 });

        const msgPayload = {
            mimetype,
        };
        msgPayload[typeKey] = Buffer.from(responseData.data);

        if (typeKey === "video") {
            msgPayload.caption = `╭━━━〔 *🎬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 📝 *${data.title?.substring(0, 50)}...*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        }

        await conn.sendMessage(from, msgPayload, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(`TikTok ${actionType} Action Error:`, err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, 'Failed to process TikTok download. Please try again.');
    }
}

// ==============================
// MAIN COMMAND: .tiktok
// ==============================

cmd(
{
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tikdl", "tk"],
    react: "🎵",
    desc: "Download TikTok video or audio",
    category: "download",
    filename: __filename
},
async (conn,  mek,  m, { q, from, sender, body }) => {
    const prefix = config.PREFIX || '.';

    // Resolve per-user language
    let userLang = await getUserLanguage(sender);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    if (!q || (!q.includes("tiktok.com") && !q.includes("vt.tiktok.com"))) {
        return sendErr(conn, mek, from, tt(userLang, 'USAGE'));
    }

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const data = await downloadTikTok(q);

        const text = `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ${tt(userLang, 'DOWNLOADER')} ★*

 📝 *${tt(userLang, 'TITLE_LABEL')}:* ${data.title?.substring(0, 60) || "TikTok Video"}
 👤 *${tt(userLang, 'AUTHOR_LABEL')}:* ${data.author?.nickname || "Unknown"}
 ❤️ *${tt(userLang, 'LIKES_LABEL')}:* ${formatNumber(data.digg_count || 0)}
 💬 *${tt(userLang, 'COMMENTS_LABEL')}:* ${formatNumber(data.comment_count || 0)}
 🔁 *${tt(userLang, 'SHARES_LABEL')}:* ${formatNumber(data.share_count || 0)}
 ⏱️ *${tt(userLang, 'DURATION_LABEL')}:* ${data.duration}s

 ────────────────────────
 📥 *${tt(userLang, 'SELECT_FORMAT')}*`;

        await sendInteractive(conn, from, mek, {
            imageUrl: data.cover || config.IMAGE_PATH,
            title:    '🎵 NovaX Mini',
            body:     text,
            footer:   config.BOT_FOOTER,
            buttons: [
                qr(tt(userLang, 'HD_BTN'),    `${prefix}tthd ${q}`),
                qr(tt(userLang, 'SD_BTN'),    `${prefix}ttsd ${q}`),
                qr(tt(userLang, 'WM_BTN'),    `${prefix}ttwm ${q}`),
                qr(tt(userLang, 'AUDIO_BTN'), `${prefix}ttaudio ${q}`),
                url(tt(userLang, 'OPEN_BTN'),  q)
            ]
        });

    } catch (err) {
        console.error("TikTok Preview Error:", err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, tt(userLang, 'FAILED'));
    }
});

// ==============================
// SUB-COMMANDS
// ==============================

cmd({ pattern: 'tthd',    dontAddCommandList: true, filename: __filename }, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    await handleTikTokAction(conn, mek, from, q, 'hd');
});

cmd({ pattern: 'ttsd',    dontAddCommandList: true, filename: __filename }, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    await handleTikTokAction(conn, mek, from, q, 'sd');
});

cmd({ pattern: 'ttwm',    dontAddCommandList: true, filename: __filename }, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    await handleTikTokAction(conn, mek, from, q, 'wm');
});

cmd({ pattern: 'ttaudio', dontAddCommandList: true, filename: __filename }, async (conn, mek, m, { q }) => {
    const from = mek.key.remoteJid;
    await handleTikTokAction(conn, mek, from, q, 'audio');
});
