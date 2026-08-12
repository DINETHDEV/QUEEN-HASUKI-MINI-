const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: "shorten",
    alias: ["short", "urlshorten"],
    react: "🔗",
    desc: "Shorten a long URL using gen-endpoint.com",
    category: "tools",
    use: ".shorten <url> [customCode]",
    filename: __filename
}, async (conn,  mek,  m, { q, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a URL to shorten!*\n┃ *Example:* \`.shorten https://google.com\`\n╰━━━━━━━━━━━━━━━┈`);
        }

        const args = q.trim().split(/\s+/);
        const originalUrl = args[0];
        const shortCode = args[1] || undefined;

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = 'https://gen-endpoint.com/api/shorten';
        const payload = { originalUrl };
        if (shortCode) {
            payload.shortCode = shortCode;
        }

        const res = await axios.post(apiUrl, payload);

        if (!res.data || !res.data.shortCode) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to shorten the URL. Please try again later.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const code = res.data.shortCode;
        // Replace localhost:3000 with gen-endpoint.com to make it a working link
        const workingShortUrl = `https://gen-endpoint.com/s/${code}`;

        let text = `╭━━━〔 *🔗 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ ✅ *URL Shortened Successfully!*
┃ 
┃ 🌐 *Original URL:* ${originalUrl}
┃ 🚀 *Short URL:* ${workingShortUrl}
┃ 🔑 *Short Code:* \`${code}\`
┃
┃ *Check stats of this link using:*
┃ \`.shortstats ${code}\`
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await reply(text);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("SHORTEN ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error shortening URL: ${err.response?.data?.message || err.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "shortstats",
    alias: ["ustats", "urlstats"],
    react: "📊",
    desc: "Get statistics for a shortened URL from gen-endpoint.com",
    category: "tools",
    use: ".shortstats <shortCode>",
    filename: __filename
}, async (conn,  mek,  m, { q, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a Short Code!*\n┃ *Example:* \`.shortstats VLZyvla\`\n╰━━━━━━━━━━━━━━━┈`);
        }

        const code = q.trim();

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://gen-endpoint.com/api/stats/${code}`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.shortCode) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to retrieve statistics for this short code.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const stats = res.data;
        const formattedDate = stats.createdAt ? new Date(stats.createdAt).toLocaleString() : 'N/A';

        let text = `╭━━━〔 *📊 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *URL Link Statistics*
┃ 
┃ 🔑 *Short Code:* \`${stats.shortCode}\`
┃ 🌐 *Original URL:* ${stats.originalUrl}
┃ 🔗 *Short Link:* https://gen-endpoint.com/s/${stats.shortCode}
┃
┃ 👥 *Total Clicks:* ${stats.totalClicks || 0}
┃ 👤 *Unique Clicks:* ${stats.uniqueClicks || 0}
┃ 📅 *Created At:* ${formattedDate}
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await reply(text);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("STATS ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error fetching stats: ${err.response?.data?.message || err.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
