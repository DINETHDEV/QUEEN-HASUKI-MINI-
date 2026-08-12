const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

const XV_API = "https://arslan-apis-v2.vercel.app";

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
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

// ❤️ React helper
async function react(sock, mek, emoji) {
    await sock.sendMessage(mek.key.remoteJid, {
        react: { text: emoji, key: mek.key }
    });
}

// 📦 Stylish info box
function xBox(data) {
    return `╭━━━〔 *🔞 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *📌 Title:* ${data.title || "Adult Video"}
┃ *⏱ Duration:* ${data.duration || "N/A"}
┃ *👁️ Views:* ${data.views || "N/A"}
┃ *🥵 Only:* 🔞....
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;
}

// 🔍 Search API
async function searchXvideos(query) {
    const api = `${XV_API}/download/xvideosSearch?text=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    if (res.data?.status && res.data.result?.length)
        return res.data.result;
    throw new Error("Search failed");
}

// 🎬 Download API
async function downloadXvideo(url) {
    const api = `${XV_API}/download/xvideosDown?url=${encodeURIComponent(url)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    if (res.data?.status && res.data.result?.url)
        return res.data.result;
    throw new Error("Download failed");
}

// ===================================
// 🔞 COMMAND: .xvideo <query|link>
// ===================================
cmd({
    pattern: "xvideo",
    alias: ["xxx", "porn", "sex", "sexyvideos", "pornhub", "xvideos", "sexy", "xxxvideo"],
    desc: "Search or download Xvideos",
    category: "adult",
    react: "🔞",
    filename: __filename
}, async (sock,  mek,  m, { q, reply, quoted }) => {
    try {
        if (!q)
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Usage:*\n┃ .xvideo <name or link>\n╰━━━━━━━━━━━━━━━┈`);

        await react(sock, mek, "🔍");

        let videoData;
        let videoUrl;

        // 🔗 Direct link
        if (q.startsWith("http")) {
            videoUrl = q;
            videoData = { title: "Xvideos Video", duration: "Unknown" };
        }
        // 🔎 Search by keyword
        else {
            const results = await searchXvideos(q);
            videoData = results[0];
            videoUrl = videoData.url;
        }

        // 📦 Send info card with thumbnail
        await sock.sendMessage(mek.key.remoteJid, {
            image: { url: videoData.thumb || "https://files.catbox.moe/aeg27n.png" },
            caption: xBox(videoData)
        }, { quoted: fakevCard });

        await react(sock, mek, "⏳");

        // 🎬 Download and send
        const file = await downloadXvideo(videoUrl);

        await sock.sendMessage(mek.key.remoteJid, {
            video: { url: file.url },
            mimetype: "video/mp4",
            fileName: `${videoData.title || "xvideo"}.mp4`,
            caption: `╭━━━〔 *🔞 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Powered By NovaX Mini*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        }, { quoted: fakevCard });

        await react(sock, mek, "✅");

    } catch (e) {
        console.error("XVIDEO ERROR:", e.message);
        await react(sock, mek, "❌");
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Download failed! Try again later.*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ===================================
// 🔞 COMMAND: .xvideodl <link> (Helper)
// ===================================
cmd({
    pattern: "xvideodl",
    alias: ["xvd", "xxxdown", "pornload"],
    desc: "Download direct Xvideos link",
    category: "adult",
    react: "🔞",
    filename: __filename
}, async (sock,  mek,  m, { q, reply, quoted }) => {
    try {
        if (!q || !q.startsWith("http"))
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Usage:*\n┃ .xvideodl <xvideos link>\n╰━━━━━━━━━━━━━━━┈`);

        await react(sock, mek, "⏳");

        const file = await downloadXvideo(q);

        await sock.sendMessage(mek.key.remoteJid, {
            video: { url: file.url },
            mimetype: "video/mp4",
            fileName: "xvideo.mp4",
            caption: `╭━━━〔 *🔞 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Powered By NovaX Mini*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        }, { quoted: fakevCard });

        await react(sock, mek, "✅");

    } catch (e) {
        console.error("XVIDEO DOWNLOAD ERROR:", e.message);
        await react(sock, mek, "❌");
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Download failed! Try again later.*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
