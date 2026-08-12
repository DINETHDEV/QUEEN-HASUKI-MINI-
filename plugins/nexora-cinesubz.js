const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

const BASE = 'https://nexoraapi.laksidunimsara.com';

cmd({
    pattern: "cinehub",
    alias: ["cinesubz", "cinesearch"],
    react: "🎬",
    desc: "Search movies/series on Cinesubz",
    category: "download",
    use: ".cinehub <movie name>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .cinehub <movie name>");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const res = await axios.get(`${BASE}/cinesubz/search`, {
            params: { q: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Search failed'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const results = data.result || data.data || data.results || [];
        if (!results.length) return reply("❌ No results found.");

        let msg = `╭━━━〔 *🎬 ᴄɪɴᴇsᴜʙᴢ sᴇᴀʀᴄʜ* 〕━━━┈\n┃ *Query:* ${text}\n┃\n`;
        for (let i = 0; i < Math.min(results.length, 15); i++) {
            const r = results[i];
            const title = r.title || r.name || r.judul || 'Unknown';
            const id = r.id || r.slug || r.url || '';
            const year = r.year || r.tahun || '';
            msg += `┃ *${i + 1}.* ${title}${year ? ` (${year})` : ''}\n`;
            if (id) msg += `┃    ID: \`${id}\`\n`;
        }
        msg += `┃\n┃ *Use .cinedetails <id> for info*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Cinesubz error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "cinedetails",
    alias: ["cinfo", "cinesubzinfo"],
    react: "📄",
    desc: "Get movie/series details from Cinesubz",
    category: "download",
    use: ".cinedetails <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .cinedetails <id>");
        await conn.sendMessage(from, { react: { text: "📄", key: mek.key } });

        const res = await axios.get(`${BASE}/cinesubz/details`, {
            params: { id: text },
            timeout: 20000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to get details'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *🎬 ᴄɪɴᴇsᴜʙᴢ ᴅᴇᴛᴀɪʟs* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || 'Unknown'}\n`;
        if (r.year) msg += `┃ *Year:* ${r.year}\n`;
        if (r.rating) msg += `┃ *Rating:* ${r.rating}\n`;
        if (r.genre) msg += `┃ *Genre:* ${Array.isArray(r.genre) ? r.genre.join(', ') : r.genre}\n`;
        if (r.country) msg += `┃ *Country:* ${r.country}\n`;
        if (r.quality) msg += `┃ *Quality:* ${r.quality}\n`;
        if (r.duration) msg += `┃ *Duration:* ${r.duration}\n`;
        if (r.status) msg += `┃ *Status:* ${r.status}\n`;
        if (r.sinopsis || r.description || r.desc) {
            const syn = r.sinopsis || r.description || r.desc;
            msg += `┃ *Synopsis:* ${syn.slice(0, 200)}${syn.length > 200 ? '...' : ''}\n`;
        }
        if (r.id || r.slug) msg += `┃\n┃ *Use .cinedl ${r.id || r.slug} to download*\n`;
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Cinesubz details error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "cinedl",
    alias: ["cinesubzdl", "cdl"],
    react: "⬇️",
    desc: "Get download link from Cinesubz",
    category: "download",
    use: ".cinedl <id>",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!text) return reply("❌ Usage: .cinedl <id>");
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        const res = await axios.get(`${BASE}/cinesubz/dl`, {
            params: { id: text },
            timeout: 30000
        });
        const data = res.data;
        if (data.success === false) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${data.message || 'Failed to get download link'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

        const r = data.result || data.data || data;
        let msg = `╭━━━〔 *⬇️ ᴄɪɴᴇsᴜʙᴢ ᴅʟ* 〕━━━┈\n`;
        msg += `┃ *Title:* ${r.title || r.name || 'Unknown'}\n`;
        if (r.quality) msg += `┃ *Quality:* ${r.quality}\n`;
        if (r.size) msg += `┃ *Size:* ${r.size}\n`;
        if (r.url || r.link || r.downloadUrl || r.download) {
            msg += `┃\n┃ 🔗 ${r.url || r.link || r.downloadUrl || r.download}\n`;
        }
        if (Array.isArray(r.links) && r.links.length) {
            msg += `┃\n┃ *Download Links:*\n`;
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
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Cinesubz DL error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
