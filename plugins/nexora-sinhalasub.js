const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

const BASE = 'https://nexoraapi.laksidunimsara.com';

cmd({
    pattern: "sinhasearch",
    alias: ["sinhalasub", "sbsub"],
    react: "🔍",
    desc: "Search Sinhala subtitles",
    category: "download",
    use: ".sinhasearch <query>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .sinhasearch <query>");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const res = await axios.get(`${BASE}/sinhalasub/search`, {
            params: { q: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Search failed'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const results = data.result || data.data || data.results || [];
        if (!results.length) return reply("❌ No subtitles found.");

        let msg = `╭━━━〔 *🔍 sɪɴʜᴀʟᴀ sᴜʙ sᴇᴀʀᴄʜ* 〕━━━┈\n┃ *Query:* ${text}\n┃\n`;
        for (let i = 0; i < Math.min(results.length, 15); i++) {
            const r = results[i];
            const title = r.title || r.name || r.judul || 'Unknown';
            const id = r.id || r.slug || '';
            msg += `┃ *${i + 1}.* ${title}\n`;
            if (id) msg += `┃    ID: \`${id}\`\n`;
        }
        msg += `┃\n┃ *Use .sinaep <id> for episode info*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Sinhalasub search error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "sinaep",
    alias: ["sinaepisode", "sbsinfo"],
    react: "📄",
    desc: "Get episode info for Sinhala subtitles",
    category: "download",
    use: ".sinaep <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .sinaep <id>");
        await conn.sendMessage(from, { react: { text: "📄", key: mek.key } });

        const res = await axios.get(`${BASE}/sinhalasub/episode-info`, {
            params: { id: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to get info'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *📄 sɪɴʜᴀʟᴀ sᴜʙ ɪɴғᴏ* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || r.series || 'Unknown'}\n`;
        if (r.episode || r.ep) msg += `┃ *Episode:* ${r.episode || r.ep}\n`;
        if (r.season) msg += `┃ *Season:* ${r.season}\n`;
        if (r.language || r.lang) msg += `┃ *Language:* ${r.language || r.lang}\n`;
        if (r.releaseDate || r.date) msg += `┃ *Release:* ${r.releaseDate || r.date}\n`;
        if (r.id || r.slug) msg += `┃\n┃ *Use .sinadl ${r.id || r.slug} to download*\n`;
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Sinhalasub info error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "sinadl",
    alias: ["sinhalasubdl", "sbsdl"],
    react: "⬇️",
    desc: "Download Sinhala subtitle",
    category: "download",
    use: ".sinadl <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .sinadl <id>");
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        const res = await axios.get(`${BASE}/sinhalasub/download`, {
            params: { id: text },
            timeout: 30000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to download'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *⬇️ sɪɴʜᴀʟᴀ sᴜʙ ᴅʟ* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || r.series || 'Unknown'}\n`;
        if (r.episode || r.ep) msg += `┃ *Episode:* ${r.episode || r.ep}\n`;
        if (r.format) msg += `┃ *Format:* ${r.format}\n`;
        if (r.size) msg += `┃ *Size:* ${r.size}\n`;
        if (r.url || r.link || r.downloadUrl || r.download) {
            msg += `┃\n┃ 🔗 ${r.url || r.link || r.downloadUrl || r.download}\n`;
        }
        if (Array.isArray(r.links) && r.links.length) {
            for (const link of r.links) {
                const url = link.url || link.link || '';
                if (url) msg += `┃ • ${url}\n`;
            }
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Sinhalasub DL error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "sinadl2",
    alias: ["sinhalasubdl2", "sbsdl2"],
    react: "⬇️",
    desc: "Alternative download for Sinhala subtitle",
    category: "download",
    use: ".sinadl2 <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .sinadl2 <id>");
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        const res = await axios.get(`${BASE}/sinhalasub/download2`, {
            params: { id: text },
            timeout: 30000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to download'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *⬇️ sɪɴʜᴀʟᴀ sᴜʙ ᴅʟ2* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || r.series || 'Unknown'}\n`;
        if (r.episode || r.ep) msg += `┃ *Episode:* ${r.episode || r.ep}\n`;
        if (r.format) msg += `┃ *Format:* ${r.format}\n`;
        if (r.size) msg += `┃ *Size:* ${r.size}\n`;
        if (r.url || r.link || r.downloadUrl || r.download) {
            msg += `┃\n┃ 🔗 ${r.url || r.link || r.downloadUrl || r.download}\n`;
        }
        if (Array.isArray(r.links) && r.links.length) {
            for (const link of r.links) {
                const url = link.url || link.link || '';
                if (url) msg += `┃ • ${url}\n`;
            }
        }
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Sinhalasub DL2 error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
