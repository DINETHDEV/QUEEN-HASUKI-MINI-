const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

const BASE = 'https://nexoraapi.laksidunimsara.com';

cmd({
    pattern: "silyrics",
    alias: ["sinhalalyrics", "silyric", "silyr"],
    react: "🎵",
    desc: "Get Sinhala song lyrics",
    category: "download",
    use: ".silyrics <song name>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .silyrics <song name>");
        await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });

        const res = await axios.get(`${BASE}/api/lyrics/sinhala`, {
            params: { q: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Lyrics not found'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        const title = r.title || r.name || r.song || r.songTitle || 'Unknown';
        const artist = r.artist || r.singer || r.author || '';
        const lyrics = r.lyrics || r.text || r.lirik || '';

        let msg = `╭━━━〔 *🎵 sɪɴʜᴀʟᴀ ʟʏʀɪᴄs* 〕━━━┈\n`;
        msg += `┃ *Song:* ${title}\n`;
        if (artist) msg += `┃ *Artist:* ${artist}\n`;
        if (lyrics) {
            msg += `┃\n┃ ${lyrics.slice(0, 1500)}${lyrics.length > 1500 ? '\n┃ ...(truncated)' : ''}\n`;
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Lyrics error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
