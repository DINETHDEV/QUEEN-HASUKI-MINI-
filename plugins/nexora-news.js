const { cmd } = require('../NovaX_Mini');
const axios = require('axios');
const config = require('../config');

const BASE = 'https://nexoraapi.laksidunimsara.com';

cmd({
    pattern: "derana",
    alias: ["derananews", "adaderana"],
    react: "📰",
    desc: "Get latest news from Ada Derana",
    category: "news",
    use: ".derana",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });
        const res = await axios.get(`${BASE}/news/derana`, { timeout: 20000 });
        const data = res.data;
        if (!data.status || !data.result) return reply("❌ No news found.");

        const news = Array.isArray(data.result) ? data.result : [data.result];
        let msg = `╭━━━〔 *📰 ᴀᴅᴀ ᴅᴇʀᴀɴᴀ ɴᴇᴡs* 〕━━━┈\n`;

        for (let i = 0; i < Math.min(news.length, 10); i++) {
            const item = news[i];
            msg += `┃\n┃ *${i + 1}.* ${item.title || 'No Title'}\n`;
            if (item.desc) msg += `┃ 📝 ${item.desc.slice(0, 100)}${item.desc.length > 100 ? '...' : ''}\n`;
            if (item.url) msg += `┃ 🔗 ${item.url}\n`;
            if (item.date) msg += `┃ 🕐 ${item.date}\n`;
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Derana news error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "siyatha",
    alias: ["siyathanews"],
    react: "📰",
    desc: "Get latest news from Siyatha News",
    category: "news",
    use: ".siyatha",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });
        const res = await axios.get(`${BASE}/news/siyatha`, { timeout: 20000 });
        const data = res.data;
        if (!data.status || !data.result) return reply("❌ No news found.");

        const news = Array.isArray(data.result) ? data.result : [data.result];
        let msg = `╭━━━〔 *📰 sɪʏᴀᴛʜᴀ ɴᴇᴡs* 〕━━━┈\n`;

        for (let i = 0; i < Math.min(news.length, 10); i++) {
            const item = news[i];
            msg += `┃\n┃ *${i + 1}.* ${item.title || 'No Title'}\n`;
            if (item.desc) msg += `┃ 📝 ${item.desc.slice(0, 100)}${item.desc.length > 100 ? '...' : ''}\n`;
            if (item.link) msg += `┃ 🔗 ${item.link}\n`;
            if (item.date) msg += `┃ 🕐 ${item.date}\n`;
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Siyatha news error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
