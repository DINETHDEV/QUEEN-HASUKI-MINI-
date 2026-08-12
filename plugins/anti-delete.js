const { cmd } = require('../NovaX_Mini');
const { setAntideleteStatus, getAntideleteStatus } = require('../data/Antidelete');

cmd({
    pattern: "antidelete",
    alias: ["antidel"],
    desc: "Turn Anti-Delete on/off",
    category: "owner",
    react: "🛡️"
},
async (conn,  mek,  m, { args, isOwner, reply, command }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is for Owner only!*\n╰━━━━━━━━━━━━━━━┈`);
    
    const mode = args[0]?.toLowerCase();

    if (mode === 'on' || mode === 'enable') {
        await setAntideleteStatus(from, true);
        await reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 🛡️ *Anti-Delete has been ENABLED!*\n╰━━━━━━━━━━━━━━━┈`);
    } else if (mode === 'off' || mode === 'disable') {
        await setAntideleteStatus(from, false);
        await reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 🛡️ *Anti-Delete has been DISABLED!*\n╰━━━━━━━━━━━━━━━┈`);
    } else {
        const current = await getAntideleteStatus(from);
        await reply(`╭━━━〔 *🛡️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Anti-Delete Status:* ${current ? "ON ✅" : "OFF ❌"}\n┃\n┃ ➤ .antidelete on\n┃ ➤ .antidelete off\n╰━━━━━━━━━━━━━━━┈`);
    }
});
