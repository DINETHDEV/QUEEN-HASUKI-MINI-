const { cmd } = require("../NovaX_Mini");
const config = require("../config");
const axios = require("axios");

const API_URL = "https://nexoraapi.laksidunimsara.com/google-drive/direct2";
const API_KEY = "lakiya_462cafcd01c0c1858fdd5ecf9e9a99a7a88fe8b4dddf4346118dce87cf7df7a7";

cmd(
{
    pattern: "gdirect",
    alias: ["gdrivedirect", "gdlink"],
    react: "💾",
    desc: "Get Google Drive Direct Download Link",
    category: "download",
    use: ".gdirect <Google Drive URL>",
    filename: __filename
},
async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;

    try {

        if (!text) {
            return reply(
`❌ Please provide a Google Drive URL.

Example:
.gdirect https://drive.google.com/file/d/xxxxxxxx/view`
            );
        }

        await conn.sendMessage(from, {
            react: {
                text: "⏳",
                key: mek.key
            }
        });

        const { data } = await axios.get(API_URL, {
            params: {
                url: text,
                api_key: API_KEY
            },
            timeout: 30000
        });

        if (!data.success) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || "Failed to fetch download link."}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        }

        const res = data.data;

        const msg = `╭━━━〔 💾 *GOOGLE DRIVE DIRECT* 〕━━━┈
┃ 📄 *File:* ${res.file_name || "Unknown"}
┃ 🆔 *File ID:* ${res.file_id}
┃ 📦 *Size:* ${res.file_size_mb} MB (${res.file_size_bytes} Bytes)
┃
┃ 👀 *View URL*
┃ ${res.view_url}
┃
┃ ⬇️ *Direct Download*
┃ ${res.direct_download_url}
┃
┃ 🚀 *Alternative Download*
┃ ${res.alt_download_url}
╰━━━━━━━━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await reply(msg);

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {

        console.error("========== GDRIVE ERROR ==========");
        console.error("Status :", err.response?.status);
        console.error("Data   :", err.response?.data);
        console.error("Message:", err.message);
        console.error("==================================");

        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });

        reply(
`❌ Google Drive API Error

Status: ${err.response?.status || "Unknown"}

${JSON.stringify(err.response?.data || err.message, null, 2)}`
        );
    }

});
