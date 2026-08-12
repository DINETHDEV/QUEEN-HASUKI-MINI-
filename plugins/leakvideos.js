
const { cmd } = require("../NovaX_Mini");
const { fakevCard } = require('../lib/fakevCard');


//================= LEAKVIDEO 1 =================

cmd({
    pattern: "leakvideo",
    desc: "Send random leak video",
    category: "fun",
    react: "🎬",
    filename: __filename
}, async (conn,  mek,  m, { reply, quoted, sender }) => {
    const from = mek.key.remoteJid;

    try {

        await reply(`╭━━━〔 *🎬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ⏳ Fetching leak video...\n╰━━━━━━━━━━━━━━━┈`);

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: `╭━━━〔 *🎬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Random Leak Video*\n╰━━━━━━━━━━━━━━━┈`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

    } catch (err) {

        console.log(err);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to load video. Please try again!*\n╰━━━━━━━━━━━━━━━┈`);

    }

});


//================= LEAKVIDEO 2 =================

cmd({
    pattern: "leakvideo2",
    desc: "Send random leak video 2",
    category: "fun",
    react: "🔥",
    filename: __filename
}, async (conn,  mek,  m, { reply, quoted, sender }) => {
    const from = mek.key.remoteJid;

    try {

        await reply(`╭━━━〔 *🔥 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ⏳ Fetching leak video...\n╰━━━━━━━━━━━━━━━┈`);

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos2";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: `╭━━━〔 *🔥 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Random Leak Video 2*\n╰━━━━━━━━━━━━━━━┈`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

    } catch (err) {

        console.log(err);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to load video. Please try again!*\n╰━━━━━━━━━━━━━━━┈`);

    }

});
