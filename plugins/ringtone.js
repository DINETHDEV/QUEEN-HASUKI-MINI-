const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "ringtone",
    alias: ["rt", "tonosearch"],
    react: "🎶",
    desc: "Search and download ringtones",
    category: "search",
    use: ".ringtone <title>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a ringtone name!*\n┃ *Example:* .ringtone apple\n╰━━━━━━━━━━━━━━━┈`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/ringtone?title=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data.status || !res.data.results || !res.data.results.length) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Ringtone not found!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const rt = res.data.results[0];

        await conn.sendMessage(from, {
            audio: { url: rt.audio },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        const info = `╭━━━〔 *🎶 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Title:* ${rt.title}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        await reply(info);

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("RINGTONE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error downloading ringtone!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
