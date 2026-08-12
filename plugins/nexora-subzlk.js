const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

const BASE = 'https://nexoraapi.laksidunimsara.com';

cmd({
    pattern: "subsearch",
    alias: ["subzlksearch", "sbs"],
    react: "🔍",
    desc: "Search subtitles on Subzlk",
    category: "download",
    use: ".subsearch <query>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .subsearch <query>");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const res = await axios.get(`${BASE}/subzlk/search`, {
            params: { q: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Search failed'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const results = data.result || data.data || data.results || [];
        if (!results.length) return reply("❌ No results found.");

        let msg = `╭━━━〔 *🔍 sᴜʙᴢʟᴋ sᴇᴀʀᴄʜ* 〕━━━┈\n┃ *Query:* ${text}\n┃\n`;
        for (let i = 0; i < Math.min(results.length, 15); i++) {
            const r = results[i];
            const title = r.title || r.name || r.judul || 'Unknown';
            const id = r.id || r.slug || r.url || '';
            msg += `┃ *${i + 1}.* ${title}\n`;
            if (id) msg += `┃    ID: \`${id}\`\n`;
        }
        msg += `┃\n┃ *Use .subinfo <id> for details*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Subzlk search error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "subinfo",
    alias: ["subzlkinfo", "sbi"],
    react: "📄",
    desc: "Get subtitle details from Subzlk",
    category: "download",
    use: ".subinfo <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .subinfo <id>");
        await conn.sendMessage(from, { react: { text: "📄", key: mek.key } });

        const res = await axios.get(`${BASE}/subzlk/info`, {
            params: { id: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to get info'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *📄 sᴜʙᴢʟᴋ ɪɴғᴏ* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || 'Unknown'}\n`;
        if (r.year) msg += `┃ *Year:* ${r.year}\n`;
        if (r.language || r.lang) msg += `┃ *Language:* ${r.language || r.lang}\n`;
        if (r.format) msg += `┃ *Format:* ${r.format}\n`;
        if (r.releaseName || r.release) msg += `┃ *Release:* ${r.releaseName || r.release}\n`;
        if (r.size) msg += `┃ *Size:* ${r.size}\n`;
        if (r.id || r.slug) msg += `┃\n┃ *Use .subdl ${r.id || r.slug} to download*\n`;
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Subzlk info error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "subdl",
    alias: ["subzlkdl", "sbdl"],
    react: "⬇️",
    desc: "Download subtitle from Subzlk",
    category: "download",
    use: ".subdl <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .subdl <id>");
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        const res = await axios.get(`${BASE}/subzlk/download`, {
            params: { id: text },
            timeout: 30000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to get download link'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *⬇️ sᴜʙᴢʟᴋ ᴅʟ* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || 'Unknown'}\n`;
        if (r.language || r.lang) msg += `┃ *Language:* ${r.language || r.lang}\n`;
        if (r.format) msg += `┃ *Format:* ${r.format}\n`;
        if (r.url || r.link || r.downloadUrl || r.download) {
            msg += `┃\n┃ 🔗 ${r.url || r.link || r.downloadUrl || r.download}\n`;
        }
        if (Array.isArray(r.links) && r.links.length) {
            msg += `┃\n┃ *Links:*\n`;
            for (const link of r.links) {
                const label = link.label || link.quality || link.name || 'Link';
                const url = link.url || link.link || '';
                if (url) msg += `┃ • ${label}: ${url}\n`;
            }
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Subzlk DL error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
