const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "gimage",
    alias: ["googleimage", "image", "img"],
    react: "🖼️",
    desc: "Search images on Google",
    category: "search",
    use: ".gimage <query>",
    filename: __filename
}, async (conn,  mek,  m, { body, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a search term!*\n┃ *Example:* .gimage cute cats\n╰━━━━━━━━━━━━━━━┈`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/googleimage?query=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);

        if (!res.data.status || !res.data.results || !res.data.results.images.length) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No images found for your query!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        // Get up to 3 images
        const images = res.data.results.images.slice(0, 3);

const { sendInteractive, qr } = require('../lib/interactive');

// ... (skipping import logic)
        for (let i = 0; i < images.length; i++) {
            await sendInteractive(conn, from, mek, {
                imageUrl: images[i].url,
                body: `╭━━━〔 *🖼️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Search:* ${q} [${i+1}/${images.length}]\n╰━━━━━━━━━━━━━━━┈`,
                buttons: [
                    qr('📋 MENU', `${config.PREFIX || '.'}menu`),
                    qr('🔍 NEXT', `${config.PREFIX || '.'}gimage ${q}`)
                ]
            });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("GIMAGE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error fetching image! Try again.*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
