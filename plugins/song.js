/**
 * NovaX Mini — Song Downloader Plugin
 *
 * BUGS FIXED:
 *   1. Removed dead import of `safeSendPluginError` (imported but never used).
 *   2. data.thumbnail from yt-search is an object { url, width, height } — not
 *      a plain string. Fixed: safely extract .url with a fallback to IMAGE_PATH.
 *   3. data.views from yt-search is a plain number — formatted with
 *      toLocaleString() for display.
 *
 * Commands:
 *   .song  <name|URL>  — search YouTube and show format selection menu
 *   .play  <name|URL>  — alias
 *   .music <name|URL>  — alias
 *   .asong <ytURL>     — download and send as playable audio
 *   .dsong <ytURL>     — download and send as document (mp3 file)
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { cmd }           = require('../NovaX_Mini');
const config            = require('../config');
const yts               = require('yt-search');
const fs                = require('fs');
const logger            = require('../lib/logger');
const { downloadAudio, cleanupAudio }   = require('../lib/ytmp3');
const { sendInteractive, qr, url }      = require('../lib/interactive');
const { getUserLanguage }               = require('../lib/database');
const { safeSendReaction }              = require('../lib/safeSend');

// ── Per-language strings ──────────────────────────────────────────────────────
const SONG_STRINGS = {
    en: {
        USAGE:         '❌ Please provide a song name or YouTube URL.\nUsage: .song <name or URL>',
        NOT_FOUND:     '❌ No results found. Try a different search term.',
        DOWNLOADER:    'Song Downloader',
        TITLE_LABEL:   'Title',
        CHANNEL_LABEL: 'Channel',
        VIEWS_LABEL:   'Views',
        DURATION_LABEL:'Duration',
        SELECT_FORMAT: 'Choose your download format:',
        AUDIO_BTN:     '🎵 Audio (MP3)',
        DOC_BTN:       '📄 Document (MP3)',
        OPEN_YT_BTN:   '▶️ Open on YouTube',
        DOWNLOADING:   '⬇️ Downloading audio… Please wait.',
        FAILED:        '❌ Download failed.',
    },
    si: {
        USAGE:         '❌ කරුණාකර ගීතයේ නම හෝ YouTube URL ලබා දෙන්න.\nඋදාහරණ: .song <නම හෝ URL>',
        NOT_FOUND:     '❌ ප්‍රතිඵල හමු නොවිණි. වෙනත් සෙවීමක් උත්සාහ කරන්න.',
        DOWNLOADER:    'ගීත බාගත කිරීම',
        TITLE_LABEL:   'මාතෘකාව',
        CHANNEL_LABEL: 'නාලිකාව',
        VIEWS_LABEL:   'දර්ශන',
        DURATION_LABEL:'කාලසීමාව',
        SELECT_FORMAT: 'ඔබේ ආකෘතිය තෝරන්න:',
        AUDIO_BTN:     '🎵 ශ්‍රව්‍ය (MP3)',
        DOC_BTN:       '📄 ලේඛනය (MP3)',
        OPEN_YT_BTN:   '▶️ YouTube හි විවෘත කරන්න',
        DOWNLOADING:   '⬇️ ශ්‍රව්‍යය බාගත කරමින්… රැඳී සිටින්න.',
        FAILED:        '❌ බාගත කිරීම අසාර්ථකයි.',
    }
};

/** Get translated string, falling back through English. */
function ts(lang, key) {
    const map = SONG_STRINGS[(lang || 'en').toLowerCase()] || SONG_STRINGS.en;
    return map[key] || SONG_STRINGS.en[key] || key;
}

// ── Error helper (matches fb.js / tiktokdl.js style) ─────────────────────────
const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(
        from,
        { text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ${text}\n╰━━━━━━━━━━━━━━━┈` },
        { quoted: mek }
    );

// ── Resolve user language (graceful fallback) ─────────────────────────────────
async function resolveLanguage(sender) {
    const lang = await getUserLanguage(sender).catch(() => null);
    if (lang) return lang.toLowerCase();
    return (config.LANGUAGE || 'en').toLowerCase();
}

// ── Safely extract thumbnail URL from yt-search result ───────────────────────
/**
 * yt-search returns thumbnail as { url, width, height } OR sometimes as a plain
 * string in older result shapes.  This function normalises both cases.
 *
 * @param {string|object|null} thumb  Raw thumbnail value from yt-search
 * @returns {string} A usable image URL (falls back to bot IMAGE_PATH)
 */
function resolveThumbnail(thumb) {
    if (!thumb) return config.IMAGE_PATH;
    if (typeof thumb === 'string') return thumb || config.IMAGE_PATH;
    if (typeof thumb === 'object' && thumb.url) return thumb.url;
    return config.IMAGE_PATH;
}

// ── YouTube search helper ─────────────────────────────────────────────────────
async function searchYouTube(query) {
    // YouTube URL — look up video directly by ID
    if (query.includes('youtube.com/watch') || query.includes('youtu.be/')) {
        const videoId = query.match(/(?:v=|youtu\.be\/)([^&?/\s]+)/)?.[1];
        if (videoId) {
            const result = await yts({ videoId });
            if (result && result.title) return result;
        }
    }

    // Text search
    const result = await yts(query);
    if (!result || !result.all || !result.all.length) return null;
    return result.all[0];
}

// ── Format large numbers for display ─────────────────────────────────────────
function formatViews(n) {
    if (typeof n !== 'number' || isNaN(n)) return 'N/A';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

// ============================================================
// COMMAND: .song / .play / .music  — Search + format menu
// ============================================================

cmd({
    pattern:  'song',
    alias:    ['play', 'music', 'songdl'],
    react:    '🎵',
    desc:     'Download YouTube Song',
    category: 'download',
    use:      '.song <name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { q, from, sender }) => {
    const prefix   = config.PREFIX || '.';
    const userLang = await resolveLanguage(sender);

    logger.info(`[SONG] Search requested by ${sender} — query: "${q}"`);

    if (!q) return sendErr(conn, mek, from, ts(userLang, 'USAGE'));

    try {
        await safeSendReaction(conn, from, mek, '🔍');

        logger.info(`[SONG] Searching YouTube: "${q}"`);
        const data = await searchYouTube(q);

        if (!data || !data.url) {
            await safeSendReaction(conn, from, mek, '❌');
            return sendErr(conn, mek, from, ts(userLang, 'NOT_FOUND'));
        }

        logger.info(`[SONG] Found: "${data.title}" — ${data.url}`);

        // FIX: thumbnail may be an object { url, width, height } from yt-search
        const thumbnailUrl = resolveThumbnail(data.thumbnail);

        const infoText =
            `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ${ts(userLang, 'DOWNLOADER')} ★*\n\n` +
            ` 🎵 *${ts(userLang, 'TITLE_LABEL')}:* ${data.title}\n` +
            ` 👤 *${ts(userLang, 'CHANNEL_LABEL')}:* ${data.author?.name || 'Unknown'}\n` +
            ` 👁️ *${ts(userLang, 'VIEWS_LABEL')}:* ${formatViews(data.views)}\n` +
            ` ⏱️ *${ts(userLang, 'DURATION_LABEL')}:* ${data.timestamp || 'N/A'}\n\n` +
            ` ────────────────────────\n` +
            ` 📥 *${ts(userLang, 'SELECT_FORMAT')}*`;

        await sendInteractive(conn, from, mek, {
            imageUrl: thumbnailUrl,
            title:    '🎵 NovaX Mini',
            body:     infoText,
            footer:   config.BOT_FOOTER,
            buttons: [
                qr(ts(userLang, 'AUDIO_BTN'), `${prefix}asong ${data.url}`),
                qr(ts(userLang, 'DOC_BTN'),   `${prefix}dsong ${data.url}`),
                url(ts(userLang, 'OPEN_YT_BTN'), data.url)
            ]
        });

        await safeSendReaction(conn, from, mek, '✅');

    } catch (e) {
        logger.error(`[SONG] Search failed — sender: ${sender} | ${e.message}`);
        await safeSendReaction(conn, from, mek, '❌');
        return sendErr(conn, mek, from, 'Failed to search YouTube. Please try again.');
    }
});

// ============================================================
// SHARED DOWNLOAD HANDLER
// ============================================================

/**
 * Downloads audio from a YouTube URL and sends it as audio or document.
 * The temp file is always cleaned up in the finally block.
 *
 * @param {object}  conn        Baileys WASocket
 * @param {object}  mek         Quoted message
 * @param {string}  from        Chat JID
 * @param {string}  sender      Sender JID
 * @param {string}  q           YouTube URL
 * @param {boolean} isDocument  true → send as document, false → send as audio
 */
async function handleDownload(conn, mek, from, sender, q, isDocument) {
    const userLang = await resolveLanguage(sender);

    // Validate that q looks like a YouTube URL
    if (!q || (!q.includes('youtu.be') && !q.includes('youtube.com'))) {
        return sendErr(conn, mek, from, ts(userLang, 'USAGE'));
    }

    let downloadResult = null;

    try {
        await safeSendReaction(conn, from, mek, '⬇️');
        await conn.sendMessage(from, { text: ts(userLang, 'DOWNLOADING') }, { quoted: mek });

        logger.info(`[SONG] Downloading — mode: ${isDocument ? 'document' : 'audio'} | url: ${q}`);
        downloadResult = await downloadAudio(q);

        const { tempFile, title } = downloadResult;

        if (!tempFile || !fs.existsSync(tempFile)) {
            throw new Error('Temp file not found after download.');
        }

        const audioBuffer = fs.readFileSync(tempFile);

        // Sanitise title for use as a filename
        const safeTitle = (title || 'audio')
            .replace(/[^\w\s\-]/g, '')
            .trim() || 'audio';

        logger.info(`[SONG] Sending — mode: ${isDocument ? 'document' : 'audio'} | title: "${safeTitle}" | size: ${Math.round(audioBuffer.length / 1024)}KB`);

        if (isDocument) {
            await conn.sendMessage(from, {
                document: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                audio:    audioBuffer,
                mimetype: 'audio/mpeg',
                ptt:      false
            }, { quoted: mek });
        }

        await safeSendReaction(conn, from, mek, '✅');
        logger.info(`[SONG] Audio sent successfully — mode: ${isDocument ? 'document' : 'audio'}`);

    } catch (e) {
        logger.error(
            `[SONG] Download failed — mode: ${isDocument ? 'dsong' : 'asong'} ` +
            `| sender: ${sender} | chat: ${from} | ${e.message}`
        );
        await safeSendReaction(conn, from, mek, '❌');
        return sendErr(conn, mek, from, `${ts(userLang, 'FAILED')} (${e.message})`);

    } finally {
        // Always clean up the temp file — even when send fails
        cleanupAudio(downloadResult);
    }
}

// ============================================================
// COMMAND: .asong <ytURL>  — Audio (playable)
// ============================================================

cmd({
    pattern:            'asong',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, false);
});

// ============================================================
// COMMAND: .dsong <ytURL>  — Document (mp3 file)
// ============================================================

cmd({
    pattern:            'dsong',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, true);
});
