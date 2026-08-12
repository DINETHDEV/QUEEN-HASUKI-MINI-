const { cmd } = require('../NovaX_Mini');
const config = require('../config');

async function checkAdmins(conn, from, sender) {
    try {
        if (conn.groupMetadataCache && typeof conn.groupMetadataCache.delete === 'function') {
            conn.groupMetadataCache.delete(from);
        }
    } catch (e) {}

    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants || [];
    
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const senderJid = sender.split(':')[0] + '@s.whatsapp.net';
    
    const admins = participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);
        
    const isBotAdmin = admins.includes(botJid);
    const isSenderAdmin = admins.includes(senderJid);
    
    return {
        isBotAdmin,
        isSenderAdmin,
        participants
    };
}

cmd({
    pattern: "mute",
    alias: ["lock", "closegc"],
    desc: "Mute the group (admins only)",
    category: "group",
    react: "🔒",
    filename: __filename
}, async (conn,  mek,  m, { quoted, command, text, isGroup, sender, isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        
        // Fetch fresh status to bypass cache and normalize JIDs
        const { isBotAdmin, isSenderAdmin } = await checkAdmins(conn, from, sender);
        
        if (!isSenderAdmin && !isOwner) return reply('❌ You must be an admin to use this command.');
        if (!isBotAdmin) return reply('❌ I must be an admin to mute the group.');

        await conn.groupSettingUpdate(from, 'announcement');
        
        await conn.sendMessage(from, {
            text: `╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group has been muted successfully!* \n┃ *Only admins can send messages now.*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
            contextInfo: { 
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: myquoted || mek });
        
    } catch (e) {
        console.error(e);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Error: ${e.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

cmd({
    pattern: "unmute",
    alias: ["unlock", "opengc"],
    desc: "Unmute the group (all members can send messages)",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn,  mek,  m, { quoted, command, text, isGroup, sender, isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        
        // Fetch fresh status to bypass cache and normalize JIDs
        const { isBotAdmin, isSenderAdmin } = await checkAdmins(conn, from, sender);
        
        if (!isSenderAdmin && !isOwner) return reply('❌ You must be an admin to use this command.');
        if (!isBotAdmin) return reply('❌ I must be an admin to unmute the group.');

        await conn.groupSettingUpdate(from, 'not_announcement');
        
        await conn.sendMessage(from, {
            text: `╭━━━〔 *🔓 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group has been unmuted successfully!* \n┃ *All members can send messages now.*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
            contextInfo: { 
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: myquoted || mek });
        
    } catch (e) {
        console.error(e);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ Error: ${e.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
