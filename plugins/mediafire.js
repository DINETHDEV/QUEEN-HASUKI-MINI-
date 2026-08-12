const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "mediafire",
    alias: ["mf", "mfdown"],
    react: "📁",
    desc: "Download files from Mediafire",
    category: "download",
    use: ".mediafire <url>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q || !q.includes("mediafire.com")) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a valid Mediafire link!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/mediafire?url=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data.status || !res.data.results) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to get Mediafire file!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const file = res.data.results;

        let caption = `╭━━━〔 *📁 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 📄 *Name:* ${file.fileName}
┃ 📦 *Size:* ${file.fileSize}
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        await conn.sendMessage(from, {
            document: { url: file.urlDownload },
            mimetype: "application/octet-stream",
            fileName: file.fileName
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("MEDIAFIRE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error downloading from Mediafire!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
