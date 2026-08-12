/**
 * NovaX Mini — Song Downloader Plugin (Fixed)
 *
 * BUGS FIXED:
 *   1. Removed `errMsg` from interactive.js import (didn't exist → crash on load).
 *   2. Uses result.tempFile (local disk file) instead of result.url for audio send.
 *   3. Added proper cleanup in finally block.
 *   4. Added structured logging for each stage.
 *   5. Added reaction status updates throughout.
 *
 * Commands:
 *   .song  <name|URL>  — search and show format selection
 *   .play  <name|URL>  — alias for .song
 *   .asong <ytURL>     — download as audio (mp3, playable)
 *   .dsong <ytURL>     — download as document (mp3 file)
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { cmd }           = require('../NovaX_Mini');
const config            = require('../config');
const yts               = require('yt-search');
const fs                = require('fs');
const logger            = require('../lib/logger');
const { downloadAudio, cleanupAudio } = require('../lib/ytmp3');
const { sendInteractive, qr, url }    = require('../lib/interactive');
const { getUserLanguage }              = require('../lib/database');
const { safeSendReaction, safeSendPluginError } = require('../lib/safeSend');

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
        SEARCHING:     '🔎 Searching...',
        DOWNLOADING:   '⬇️ Downloading audio… Please wait.',
        FAILED:        '❌ Download failed.',
        TOO_LONG:      '❌ This video is too long to download (max 10 minutes).',
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
        SEARCHING:     '🔎 සොයමින්...',
        DOWNLOADING:   '⬇️ ශ්‍රව්‍යය බාගත කරමින්… රැඳී සිටින්න.',
        FAILED:        '❌ බාගත කිරීම අසාර්ථකයි.',
        TOO_LONG:      '❌ මෙම වීඩියෝව ඉතා දිගයි (උපරිම මිනිත්තු 10).',
    }
};

function ts(lang, key) {
    const map = SONG_STRINGS[(lang || 'en').toLowerCase()] || SONG_STRINGS.en;
    return map[key] || SONG_STRINGS.en[key] || key;
}

// ── Error helper ──────────────────────────────────────────────────────────────
const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from,
        { text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ${text}\n╰━━━━━━━━━━━━━━━┈` },
        { quoted: mek }
    );

// ── Resolve user language ─────────────────────────────────────────────────────
async function resolveLanguage(sender) {
    let lang = await getUserLanguage(sender).catch(() => null);
    if (!lang) lang = (config.LANGUAGE || 'en').toLowerCase();
    return lang;
}

// ── Search helper ─────────────────────────────────────────────────────────────
async function searchYouTube(query) {
    // If it's already a YouTube URL, extract video info
    if (query.includes('youtube.com/watch') || query.includes('youtu.be/')) {
        const videoId = query.match(/(?:v=|youtu\.be\/)([^&?/\s]+)/)?.[1];
        if (videoId) {
            const result = await yts({ videoId });
            if (result && result.title) return result;
        }
    }
    // Otherwise text search
    const result = await yts(query);
    if (!result || !result.all || !result.all.length) return null;
    return result.all[0];
}

// ============================================================
// COMMAND: .song / .play / .music / .songdl  — Search + menu
// ============================================================

cmd({
    pattern:  'song',
    alias:    ['play', 'music', 'songdl'],
    react:    '🎵',
    desc:     'Download YouTube Song',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { q, from, sender, body }) => {
    const prefix   = config.PREFIX || '.';
    const userLang = await resolveLanguage(sender);

    logger.info(`[NovaX:SONG] Search requested by ${sender} — query: "${q}"`);

    if (!q) return sendErr(conn, mek, from, ts(userLang, 'USAGE'));

    try {
        await safeSendReaction(conn, from, mek, '🔍');

        logger.info(`[NovaX:SONG] Searching YouTube: "${q}"`);
        const data = await searchYouTube(q);

        if (!data || !data.url) {
            await safeSendReaction(conn, from, mek, '❌');
            return sendErr(conn, mek, from, ts(userLang, 'NOT_FOUND'));
        }

        logger.info(`[NovaX:SONG] Found: "${data.title}" — ${data.url}`);

        const infoText =
            `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ${ts(userLang, 'DOWNLOADER')} ★*\n\n` +
            ` 🎵 *${ts(userLang, 'TITLE_LABEL')}:* ${data.title}\n` +
            ` 👤 *${ts(userLang, 'CHANNEL_LABEL')}:* ${data.author?.name || 'Unknown'}\n` +
            ` 👁️ *${ts(userLang, 'VIEWS_LABEL')}:* ${data.views || 'N/A'}\n` +
            ` ⏱️ *${ts(userLang, 'DURATION_LABEL')}:* ${data.timestamp || 'N/A'}\n\n` +
            ` ────────────────────────\n` +
            ` 📥 *${ts(userLang, 'SELECT_FORMAT')}*`;

        await sendInteractive(conn, from, mek, {
            imageUrl: data.thumbnail,
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
        logger.error(`[NovaX:ERROR] Command: song | Stage: search | ${e.message}`);
        await safeSendReaction(conn, from, mek, '❌');
        return sendErr(conn, mek, from, 'Failed to search YouTube. Please try again.');
    }
});

// ============================================================
// SHARED DOWNLOAD HANDLER
// ============================================================

/**
 * Downloads audio and sends it as audio or document.
 * Uses temp file — always cleaned up in finally.
 */
async function handleDownload(conn, mek, from, sender, q, isDocument) {
    const userLang = await resolveLanguage(sender);

    if (!q || (!q.includes('youtu.be') && !q.includes('youtube.com'))) {
        return sendErr(conn, mek, from, ts(userLang, 'USAGE'));
    }

    let downloadResult = null;

    try {
        await safeSendReaction(conn, from, mek, '⬇️');
        await conn.sendMessage(from, { text: ts(userLang, 'DOWNLOADING') }, { quoted: mek });

        logger.info(`[NovaX:SONG] Downloading audio for: ${q}`);
        downloadResult = await downloadAudio(q);

        const { tempFile, title } = downloadResult;

        if (!tempFile || !fs.existsSync(tempFile)) {
            throw new Error('Temp file not found after download.');
        }

        const audioBuffer = fs.readFileSync(tempFile);
        const safeTitle   = (title || 'audio').replace(/[^\w\s-]/g, '').trim() || 'audio';

        logger.info(`[NovaX:SONG] Sending audio: "${safeTitle}" (${Math.round(audioBuffer.length / 1024)}KB)`);

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
        logger.info(`[NovaX:SONG] Audio sent successfully.`);

    } catch (e) {
        logger.error(`[NovaX:ERROR] Command: ${isDocument ? 'dsong' : 'asong'} | Stage: download | Sender: ${sender} | Chat: ${from} | ${e.message}\n${e.stack}`);
        await safeSendReaction(conn, from, mek, '❌');
        return sendErr(conn, mek, from, `${ts(userLang, 'FAILED')} (${e.message})`);

    } finally {
        // Always clean up temp file regardless of success or failure
        cleanupAudio(downloadResult);
    }
}

// ============================================================
// COMMAND: .asong <ytURL>  — Audio download
// ============================================================

cmd({
    pattern:            'asong',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, false);
});

// ============================================================
// COMMAND: .dsong <ytURL>  — Document download
// ============================================================

cmd({
    pattern:            'dsong',
    dontAddCommandList: true,
    filename:           __filename
}, async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, true);
});
