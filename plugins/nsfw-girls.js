const { cmd } = require("../NovaX_Mini");
const config = require('../config');
const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

// ============================================================
// Helper: fetch a random NSFW image URL from waifu.pics
// ============================================================
async function getNsfwImage(type) {
    const res = await axios.get(`https://api.waifu.pics/nsfw/${type}`, { timeout: 15000 });
    if (!res.data || !res.data.url) throw new Error("No image URL returned");
    return res.data.url;
}

// ============================================================
// .boobs | .xboobs | .bobs
// ============================================================
cmd({
    pattern: "boobs",
    alias: ["xboobs", "bobs"],
    desc: "Random NSFW Girl Image",
    category: "adult",
    react: "🌸",
    filename: __filename
}, async (conn,  mek,  m, { body, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const imgUrl = await getNsfwImage("waifu");

        const { sendInteractive, qr } = require('../lib/interactive');
        await sendInteractive(conn, from, mek, {
            imageUrl: imgUrl,
            body: `╭━━━〔 *🌸 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Random X Girl*\n┃ *🔞 18+ Content Only*\n╰━━━━━━━━━━━━━━━┈`,
            buttons: [
                qr('📋 MENU', `${config.PREFIX || '.'}menu`),
                qr('🔄 NEXT', `${config.PREFIX || '.'}boobs`)
            ]
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("BOOBS ERROR:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to fetch image. Please try again!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ============================================================
// .xgirl | .xgirls | .ximg
// ============================================================
cmd({
    pattern: "xgirl",
    alias: ["xgirls", "ximg"],
    desc: "Random NSFW Girl Image",
    category: "adult",
    react: "🌸",
    filename: __filename
}, async (conn,  mek,  m, { body, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Randomly pick between waifu types for variety
        const types = ["waifu", "neko", "trap"];
        const type = types[Math.floor(Math.random() * types.length)];
        const imgUrl = await getNsfwImage(type);

        const { sendInteractive, qr } = require('../lib/interactive');
        await sendInteractive(conn, from, mek, {
            imageUrl: imgUrl,
            body: `╭━━━〔 *🌸 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Random X Girl*\n┃ *🔞 18+ Content Only*\n╰━━━━━━━━━━━━━━━┈`,
            buttons: [
                qr('📋 MENU', `${config.PREFIX || '.'}menu`),
                qr('🔄 NEXT', `${config.PREFIX || '.'}xgirl`)
            ]
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("XGIRL ERROR:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to fetch image. Please try again!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
