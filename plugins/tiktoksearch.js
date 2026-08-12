const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "tiktoksearch",
    alias: ["tks", "ttsearch"],
    react: "🔍",
    desc: "Search videos on TikTok",
    category: "search",
    use: ".tks <query>",
    filename: __filename
},
async (conn,  mek,  m, { quoted, q, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a search term!*\n┃ *Example:* .tks funny cats\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const searchApi = `https://www.movanest.xyz/v2/tiktoksearch?query=${encodeURIComponent(q)}`;
        const res = await axios.get(searchApi);
        const data = res.data;

        if (!data || !data.status || !data.results || data.results.length === 0) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No TikTok videos found for your search!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        // Show top 5 or 10 results
        const videos = data.results.slice(0, 10);
        
        let text = `╭━━━〔 *🎵 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *TikTok Search Results*\n┃ 🔎 Query: ${q}\n╰━━━━━━━━━━━━━━━┈\n\n`;

        for (let i = 0; i < videos.length; i++) {
            const v = videos[i];
            const title = v.title ? v.title.substring(0, 60).replace(/\n/g, ' ') : "No Title";
            const author = v.author ? v.author.nickname : "Unknown";
            const views = v.play_count || 0;
            const likes = v.digg_count || 0;
            const link = v.play || "No link";

            text += `*${i + 1}.* ${title}...\n`;
            text += `   👤 *Author:* ${author}\n`;
            text += `   👁️ *Views:* ${views} | ❤️ *Likes:* ${likes}\n`;
            text += `   🔗 *Link:* ${link}\n\n`;
        }

        text += `> ${config.BOT_FOOTER}`;

        // Send a cover image of the first result along with the text if possible
        if (videos[0].cover) {
            await conn.sendMessage(
                from,
                { image: { url: videos[0].cover }, caption: text },
                { quoted: mek }
            );
        } else {
            await conn.sendMessage(
                from,
                { text },
                { quoted: mek }
            );
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log("TIKTOK SEARCH ERROR:", e);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *TikTok search failed! Try again later.*\n╰━━━━━━━━━━━━━━━┈`);
        
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
