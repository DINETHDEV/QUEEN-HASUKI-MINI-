const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "threads",
    alias: ["thread", "thdown"],
    react: "🧵",
    desc: "Download videos/images from Threads",
    category: "download",
    use: ".threads <url>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q || !q.includes("threads.net")) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a valid Threads link!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/threads?url=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data.status || !res.data.results) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to fetch from Threads!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const data = res.data.results;
        const caption = `╭━━━〔 *🧵 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Threads Download Success!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        if (data.video) {
            await conn.sendMessage(from, {
                video: { url: data.video },
                caption: caption
            }, { quoted: mek });
        } else if (data.thumbnail) {
            await conn.sendMessage(from, {
                image: { url: data.thumbnail },
                caption: caption
            }, { quoted: mek });
        } else {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No media found in this Thread!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("THREADS ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error downloading from Threads!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
