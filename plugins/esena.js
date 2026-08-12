const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "esenanews",
    alias: ["esena", "esnews"],
    react: "📰",
    desc: "Get latest news from Esena News",
    category: "news",
    use: ".esenanews",
    filename: __filename
}, async (conn,  mek,  m, { q, reply, text }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, {
            react: { text: "📡", key: mek.key }
        });

        const apiUrl = q
            ? `https://esena-news-api-v3.vercel.app/news/search?q=${encodeURIComponent(q)}`
            : `https://esena-news-api-v3.vercel.app/news/latest`;

        const { data } = await axios.get(apiUrl, {
            timeout: 20000,
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        // API returns: { news_data: { status: {...}, data: [...] } }
        const articles =
            data?.news_data?.data ||
            data?.data ||
            data?.articles ||
            data?.results ||
            [];

        if (!Array.isArray(articles) || articles.length === 0) {
            return reply(
`╭━━━〔 *📰 ᴇsᴇɴᴀ ɴᴇᴡs* 〕━━━┈
┃ *No news found!*
╰━━━━━━━━━━━━━━━┈`
            );
        }

        const cachedTime = data?.news_data?.status?.cached_on || "";
        const count = Math.min(articles.length, 10);

        let msg =
`╭━━━〔 *📰 ᴇsᴇɴᴀ ɴᴇᴡs* 〕━━━┈
┃ *Latest News* ${cachedTime ? `| 🕒 ${cachedTime}` : ""}
┃
`;

        for (let i = 0; i < count; i++) {
            const item = articles[i];

            const title =
                item.titleSi ||
                item.titleEn ||
                item.title ||
                "No Title";

            // contentSi/contentEn are strings (not arrays) — just trim whitespace
            const rawSi = typeof item.contentSi === "string" ? item.contentSi.trim() : "";
            const rawEn = typeof item.contentEn === "string" ? item.contentEn.trim() : "";
            let desc = rawSi || rawEn || "";

            if (desc.length > 120) {
                desc = desc.substring(0, 120) + "...";
            }

            const link = item.share_url || "";
            const published = item.published ? item.published.split(" ")[0] : "";

            msg += `┃ *${i + 1}. ${title}*\n`;
            if (desc) msg += `┃ 📝 ${desc}\n`;
            if (published) msg += `┃ 📅 ${published}\n`;
            if (link) msg += `┃ 🔗 ${link}\n`;
            msg += `┃\n`;
        }

        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (err) {
        console.error("ESENA NEWS ERROR:", err.response?.data || err.message);

        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });

        reply(
`╭━━━〔 *❌ ᴇsᴇɴᴀ ɴᴇᴡs* 〕━━━┈
┃ *News fetch failed!*
┃ *Error:* ${err.response?.status || err.message}
╰━━━━━━━━━━━━━━━┈`
        );
    }
});
