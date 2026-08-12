const { cmd } = require("../NovaX_Mini");
const axios = require("axios");
const config = require("../config");

cmd({
    pattern: "hirunews",
    alias: ["hiru", "news"],
    react: "📰",
    desc: "Latest Hiru News",
    category: "news",
    filename: __filename
},
async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {

        await conn.sendMessage(from, {
            react: { text: "📡", key: mek.key }
        });

        const { data } = await axios.get(
            "https://hiru-news-ow4q995r5-no-bug-s-projects.vercel.app/news",
            {
                timeout: 20000,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json"
                }
            }
        );

        const articles = data.articles || data.result || (Array.isArray(data) ? data : []);

        if (!articles.length) {
            return reply("❌ No news found.");
        }

        let msg = `╭━━━〔 *📰 ʜɪʀᴜ ɴᴇᴡs* 〕━━━┈\n`;
        msg += `┃ *Latest News*\n┃\n`;

        for (let i = 0; i < Math.min(10, articles.length); i++) {
            const item = articles[i];
            const title = item.title || item.titleSi || item.titleEn || "No Title";
            msg += `┃ *${i + 1}.* ${title}\n`;
            if (item.desc || item.description) {
                const desc = item.desc || item.description;
                msg += `┃ 📝 ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}\n`;
            }
            if (item.url || item.link) {
                msg += `┃ 🔗 ${item.url || item.link}\n`;
            }
            if (item.date || item.time) {
                msg += `┃ 🕐 ${item.date || item.time}\n`;
            }
            msg += `┃\n`;
        }

        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (err) {
        console.log(err.response?.data || err.message);

        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });

        reply(
`❌ Hiru News Error

Status : ${err.response?.status || "Unknown"}
Message: ${err.response?.data?.message || err.message}`
        );
    }
});
