const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url } = require('../lib/interactive');
const { getUserLanguage } = require('../lib/database');
const { t } = require('../lib/language');

const XV_API = "https://arslan-apis-v2.vercel.app";

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    }
};

// 🔁 Retry helper
async function tryRequest(fn, tries = 3) {
    let err;
    for (let i = 1; i <= tries; i++) {
        try {
            return await fn();
        } catch (e) {
            err = e;
            await new Promise(r => setTimeout(r, i * 1000));
        }
    }
    throw err;
}

// 🔍 Search API
async function searchXvideos(query) {
    const api = `${XV_API}/download/xvideosSearch?text=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    if (res.data?.status && res.data.result?.length)
        return res.data.result;
    throw new Error("Search failed");
}

// ===================================
// 🔞 COMMAND: .xvsearch <query>
// ===================================
cmd({
    pattern: "xvsearch",
    alias: ["xvs", "xvideosearch", "xxxsearch"],
    desc: "Search Xvideos and get list",
    category: "adult",
    react: "🔞",
    filename: __filename
}, async (sock,  mek,  m, { q, reply, sender, body, text }) => {
    const prefix = config.PREFIX || '.';
    let userLang = await getUserLanguage(sender);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    if (!q) {
        return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Usage:* .xvsearch <query>\n╰━━━━━━━━━━━━━━━┈`);
    }

    try {
        await sock.sendMessage(mek.key.remoteJid, { react: { text: "🔍", key: mek.key } });

        const results = await searchXvideos(q);
        const topResults = results.slice(0, 5); // Limit to top 5 for button fits

        if (!topResults.length) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No results found for your query.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        let msg = `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — 𝘟𝘝𝘐𝘋𝘌𝘖𝘚 𝘚𝘌𝘈𝘙𝘊𝘏 ★*\n\n`;
        msg += `*Query:* ${q}\n\n`;

        topResults.forEach((video, index) => {
            msg += `*${index + 1}.* ${video.title}\n`;
            msg += `⏱️ *Duration:* ${video.duration || 'N/A'}\n\n`;
        });

        // Build list of quick-reply buttons (Max 5 allowed by WhatsApp native flow)
        const buttons = topResults.map((video, index) => {
            // Display title safely inside button (limit length to 20 chars)
            let shortTitle = video.title.length > 15 ? video.title.substring(0, 15) + '...' : video.title;
            return qr(`📥 Video ${index + 1} (${shortTitle})`, `${prefix}xvideodl ${video.url}`);
        });

        await sendInteractive(sock, mek.key.remoteJid, mek, {
            imageUrl: topResults[0]?.thumb || config.IMAGE_PATH,
            title: '🔞 XVideos Search',
            body: msg,
            footer: config.BOT_FOOTER,
            buttons
        });

        await sock.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("XVIDEO SEARCH ERROR:", e.message);
        await sock.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Search failed! Try again later.*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
