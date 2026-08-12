const { cmd, commands } = require("../NovaX_Mini");
const config = require('../config');

cmd({
    pattern: "menuinfo",
    alias: ["cmdinfo", "help", "commandinfo"],
    react: "ℹ️",
    desc: "Show all commands with details. Use .menuinfo <cmd> for single command info",
    category: "system",
    use: ".menuinfo",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || '.';

        if (text) {
            const search = text.toLowerCase().trim();
            const cmd = commands.find(c =>
                c.pattern === search ||
                (c.alias && c.alias.includes(search))
            );
            if (!cmd) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Command "${text}" not found.\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

            let msg = `╭━━━〔 *ℹ️ ᴄᴏᴍᴍᴀɴᴅ ɪɴғᴏ* 〕━━━┈\n`;
            msg += `┃ *Command:* ${prefix}${cmd.pattern}\n`;
            if (cmd.alias && cmd.alias.length) msg += `┃ *Aliases:* ${cmd.alias.map(a => `${prefix}${a}`).join(', ')}\n`;
            if (cmd.desc) msg += `┃ *Description:* ${cmd.desc}\n`;
            if (cmd.category) msg += `┃ *Category:* ${cmd.category}\n`;
            if (cmd.use) msg += `┃ *Usage:* ${cmd.use}\n`;
            if (cmd.react) msg += `┃ *Reaction:* ${cmd.react}\n`;
            msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
            return await reply(msg);
        }

        const grouped = {};
        for (const cmd of commands) {
            if (!cmd.pattern || cmd.dontAddCommandList) continue;
            const cat = cmd.category || 'misc';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(cmd);
        }

        const categoryEmojis = {
            download: "📥", search: "🔍", sticker: "🎭", tools: "🛠️",
            owner: "👑", group: "👥", adult: "🔞", general: "🌐",
            system: "⚙️", main: "🏠", news: "📰", misc: "✨"
        };

        let msg = `╭━━━━━━━━━━━━━━━━━━━━━━━┈
┃  *📋 ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs ᴡɪᴛʜ ᴅᴇsᴄʀɪᴘᴛɪᴏɴs*
╰━━━━━━━━━━━━━━━━━━━━━━━┈\n\n`;
        for (const cat in grouped) {
            const emoji = categoryEmojis[cat] || "✨";
            msg += `╭─〔 ${emoji} *${cat.toUpperCase()}* 〕\n`;
            for (const c of grouped[cat]) {
                const desc = c.desc ? ` — ${c.desc.slice(0, 40)}${c.desc.length > 40 ? '...' : ''}` : '';
                msg += `┃ ◈ *${prefix}${c.pattern}*${desc}\n`;
            }
            msg += `╰━━━━━━━━━━┈\n\n`;
        }
        msg += `╭━━━〔 *💡* 〕━━━┈\n`;
        msg += `┃ Use *${prefix}menuinfo <cmd>* for full details\n`;
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("MenuInfo Error:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ MenuInfo error: ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
