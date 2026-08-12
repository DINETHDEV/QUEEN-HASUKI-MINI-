const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const yts = require('yt-search');
const { sendInteractive, qr, url, select, errMsg } = require('../lib/interactive');

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', text) }, { quoted: mek });

cmd({
    pattern:  'yts',
    alias:    ['ytsearch', 'ytsrch', 'ytsearch'],
    react:    '🔍',
    desc:     'Search videos on YouTube',
    category: 'search',
    use:      '.yts <video name>',
    filename: __filename
}, async (conn,  mek,  m, { q, text }) => {
    const from = mek.key.remoteJid;
    const prefix = config.PREFIX || '.';

    if (!q) {
        return sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            title:    '🔍 NovaX Mini',
            body:
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ʏᴏᴜᴛᴜʙᴇ ꜱᴇᴀʀᴄʜ ★*

 ℹ️ *Usage:* .yts <video name>
 📌 *Example:* .yts Shape of You`,
            footer:  config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }

    try {
        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const search = await yts(q);
        const videos = (search.videos || []).slice(0, 8);

        if (!videos.length)
            return sendErr(conn, mek, from, `No results found for: *${q}*`);

        const top = videos[0];

        const body =
`*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ʏᴏᴜᴛᴜʙᴇ ꜱᴇᴀʀᴄʜ ★*

 🔎 *Query:* ${q}
 📊 *Found:* ${videos.length} results

 ─── 🏆 Top Result ───
 🎬 *${top.title.substring(0, 55)}*
 👤 *${top.author?.name || 'Unknown'}*
 ⏱️ *${top.timestamp}*   👁️ *${(top.views || 0).toLocaleString()}*

 ────────────────────────
 📥 *Select from list or play top result:*`;

        // Build dropdown list of all results
        const rows = videos.map((v, i) => ({
            title:       `${i + 1}. ${v.title.substring(0, 50)}`,
            description: `⏱️ ${v.timestamp} • 👁️ ${(v.views || 0).toLocaleString()} • 👤 ${v.author?.name || 'Unknown'}`,
            id:          `${prefix}song ${v.url}`
        }));

        await sendInteractive(conn, from, mek, {
            imageUrl: top.thumbnail,
            title:    '🔍 NovaX Mini',
            body,
            footer:   config.BOT_FOOTER,
            buttons: [
                qr('🎵 Play Top Result',   `${prefix}song ${top.url}`),
                qr('🎧 Download Audio',    `${prefix}asong ${top.url}`),
                select('📋 All Results',   [{ title: 'YouTube Search Results', rows }]),
                url('▶️ Open YouTube',     top.url)
            ]
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('YTS ERROR:', e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return sendErr(conn, mek, from, 'YouTube search failed. Please try again.');
    }
});
