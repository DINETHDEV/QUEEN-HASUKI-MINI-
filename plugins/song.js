const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const yts = require('yt-search');
const { downloadAudio } = require('../lib/ytmp3');
const { sendInteractive, qr, url, errMsg } = require('../lib/interactive');
const { getUserLanguage } = require('../lib/database');
const { getLang } = require('../lib/lang');

// ── Per-language song strings ─────────────────────────────────────────────────
const SONG_STRINGS = {
    en: {
        USAGE:        '❌ Please provide a song name or YouTube URL.\nUsage: .song <name or URL>',
        NOT_FOUND:    '❌ No results found. Try a different search term.',
        DOWNLOADER:   'Song Downloader',
        TITLE_LABEL:  'Title',
        CHANNEL_LABEL:'Channel',
        VIEWS_LABEL:  'Views',
        DURATION_LABEL:'Duration',
        SELECT_FORMAT:'Choose your download format:',
        AUDIO_BTN:    '🎵 Audio (MP3)',
        DOC_BTN:      '📄 Document (MP3)',
        OPEN_YT_BTN:  '▶️ Open on YouTube',
        DOWNLOADING:  '⏳ Downloading your audio… Please wait.',
        FAILED:       '❌ Download failed.',
    },
    si: {
        USAGE:        '❌ කරුණාකර ගීතයේ නම හෝ YouTube URL ලබා දෙන්න.\nඋදාහරණ: .song <නම හෝ URL>',
        NOT_FOUND:    '❌ ප්‍රතිඵල හමු නොවිණි. වෙනත් සෙවීමක් උත්සාහ කරන්න.',
        DOWNLOADER:   'ගීත බාගත කිරීම',
        TITLE_LABEL:  'මාතෘකාව',
        CHANNEL_LABEL:'නාලිකාව',
        VIEWS_LABEL:  'දර්ශන',
        DURATION_LABEL:'කාලසීමාව',
        SELECT_FORMAT:'ඔබේ ආකෘතිය තෝරන්න:',
        AUDIO_BTN:    '🎵 ශ්‍රව්‍ය (MP3)',
        DOC_BTN:      '📄 ලේඛනය (MP3)',
        OPEN_YT_BTN:  '▶️ YouTube හි විවෘත කරන්න',
        DOWNLOADING:  '⏳ ශ්‍රව්‍යය බාගත කරමින්… රැඳී සිටින්න.',
        FAILED:       '❌ බාගත කිරීම අසාර්ථකයි.',
    }
};

/**
 * Get song string for a language, falling back to English.
 * @param {string} lang  Language code
 * @param {string} key   String key
 */
function ts(lang, key) {
    const map = SONG_STRINGS[(lang || 'en').toLowerCase()] || SONG_STRINGS.en;
    return map[key] || SONG_STRINGS.en[key] || key;
}

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ${text}\n╰━━━━━━━━━━━━━━━┈` }, { quoted: mek });

// ==============================
// MAIN SONG COMMAND (SEARCH)
// ==============================

cmd(
{
    pattern: 'song',
    alias: ['play', 'music', 'songdl'],
    react: '🎵',
    desc: 'Download YouTube Song',
    category: 'download',
    filename: __filename
},
async (conn,  mek,  m, { q, from, sender, body }) => {
    const prefix = config.PREFIX || '.';

    let userLang = await getUserLanguage(sender);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    if (!q)
        return sendErr(conn, mek, from, ts(userLang, 'USAGE'));

    try {
        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Support direct YouTube URL or search term
        let data;
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            const videoId = q.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1] || q;
            const result = await yts({ videoId });
            data = result;
        } else {
            const result = await yts(q);
            if (!result.all || !result.all.length)
                return sendErr(conn, mek, from, ts(userLang, 'NOT_FOUND'));
            data = result.all[0];
        }

        if (!data || !data.url)
            return sendErr(conn, mek, from, ts(userLang, 'NOT_FOUND'));

        const text = `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ${ts(userLang, 'DOWNLOADER')} ★*

 🎵 *${ts(userLang, 'TITLE_LABEL')}:* ${data.title}
 👤 *${ts(userLang, 'CHANNEL_LABEL')}:* ${data.author?.name || 'Unknown'}
 👁️ *${ts(userLang, 'VIEWS_LABEL')}:* ${data.views || 'N/A'}
 ⏱️ *${ts(userLang, 'DURATION_LABEL')}:* ${data.timestamp || 'N/A'}

 ────────────────────────
 📥 *${ts(userLang, 'SELECT_FORMAT')}*`;

        await sendInteractive(conn, from, mek, {
            imageUrl: data.thumbnail,
            title:    '🎵 NovaX Mini',
            body:     text,
            footer:   config.BOT_FOOTER,
            buttons: [
                qr(ts(userLang, 'AUDIO_BTN'), `${prefix}asong ${data.url}`),
                qr(ts(userLang, 'DOC_BTN'),   `${prefix}dsong ${data.url}`),
                url(ts(userLang, 'OPEN_YT_BTN'), data.url)
            ]
        });

    } catch (e) {
        console.error('SONG SEARCH ERROR:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, 'Failed to search YouTube. Please try again.');
    }
});

// ==============================
// REUSABLE DOWNLOAD HELPER
// ==============================

async function handleDownload(conn, mek, from, sender, q, isDocument) {
    let userLang = await getUserLanguage(sender);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    if (!q || (!q.includes('youtu.be') && !q.includes('youtube.com'))) {
        return sendErr(conn, mek, from, ts(userLang, 'USAGE'));
    }

    try {
        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        // Show premium processing message
        await conn.sendMessage(from, { text: ts(userLang, 'DOWNLOADING') }, { quoted: mek });

        // downloadAudio returns { url, title, duration, thumbnail }
        const stream = await downloadAudio(q);
        if (!stream || !stream.url) {
            throw new Error('API returned no download link.');
        }

        if (isDocument) {
            await conn.sendMessage(from, {
                document: { url: stream.url },
                mimetype: 'audio/mpeg',
                fileName: `${stream.title || 'audio'}.mp3`
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                audio:    { url: stream.url },
                mimetype: 'audio/mpeg',
                ptt:      false
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('SONG DOWNLOAD ERROR:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, `${ts(userLang, 'FAILED')} (${e.message})`);
    }
}

// ==============================
// AUDIO DOWNLOAD (.asong)
// ==============================

cmd(
{
    pattern: 'asong',
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, false);
});

// ==============================
// DOCUMENT DOWNLOAD (.dsong)
// ==============================

cmd(
{
    pattern: 'dsong',
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { q, from, sender }) => {
    await handleDownload(conn, mek, from, sender, q, true);
});
