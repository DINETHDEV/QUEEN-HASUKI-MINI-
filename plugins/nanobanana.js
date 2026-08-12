const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "nanobanana",
    alias: ["nb", "nano", "bananapub"],
    react: "🍌",
    desc: "Generate or manipulate images using NanoBanana",
    category: "tools",
    use: ".nanobanana <prompt> | <image_url>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q || !q.includes('|')) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Format incorrect!*\n┃ *Use:* .nanobanana prompt | image_url\n┃ *Example:* .nanobanana Make it funny | https://example.com/img.png\n╰━━━━━━━━━━━━━━━┈`);
        }

        const args = q.split('|');
        const prompt = args[0].trim();
        const imageUrl = args[1].trim();

        if (!imageUrl.startsWith('http')) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a valid HTTP image URL!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/nanobanana-pub?image_url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&maxTries=20`;
        const res = await axios.get(apiUrl, { timeout: 60000 }); // Can take a while

        if (!res.data || !res.data.status || !res.data.results) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to generate image via NanoBanana!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const generatedImage = res.data.results.image || res.data.results.url || res.data.results; // Based on common API structures

        await conn.sendMessage(from, {
            image: { url: generatedImage },
            caption: `╭━━━〔 *🍌 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Prompt:* ${prompt}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("NANOBANANA ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *NanoBanana processing failed or timed out!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
