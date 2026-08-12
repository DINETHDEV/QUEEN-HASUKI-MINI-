const { cmd, commands } = require('../NovaX_Mini');
const config = require('../config');
const os = require('os');

cmd({
    pattern: "Uptime",
    alias: ["speed"],
    desc: "Check bot uptime and system resources",
    category: "general",
    react: "⚡"
},
async (conn,  mek,  m, { quoted, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const start = Date.now();

        const msg = await conn.sendMessage(from, { text: `╭━━━〔 *⚡ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Testing speed...*\n╰━━━━━━━━━━━━━━━┈` }, { quoted: myquoted });

        const end = Date.now();
        const latency = end - start;

        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
        const usedMem = (totalMem - freeMem).toFixed(0);

        const pingMsg = `╭━━━〔 *⚡ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 🕒 *Uptime:* ${latency}ms
┃ 💾 *RAM:* ${usedMem}MB / ${totalMem}MB
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, { text: pingMsg, edit: msg.key });

    } catch (e) {
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error: ${e.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

