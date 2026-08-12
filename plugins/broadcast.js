const { cmd } = require('../NovaX_Mini');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  📢 BROADCAST PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Send a message to all groups or all DMs
// ════════════════════════════════════════════════════════

cmd({
    pattern: 'broadcast',
    alias: ['bc'],
    desc: 'Broadcast a message to all groups (Owner only)',
    category: 'owner',
    react: '📢',
    use: '.broadcast <message> | .broadcast -dm <message>',
    filename: __filename,
}, async (conn,  mek,  m, { command, args, q, isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isOwner) return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Owner only command!*\n╰━━━━━━━━━━━━━━━┈`);
        if (config.BROADCAST_ENABLE !== 'true') return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Broadcast is disabled in config.*\n╰━━━━━━━━━━━━━━━┈`);

        const isDM = args[0] === '-dm';
        const text = isDM ? args.slice(1).join(' ') : q;

        if (!text) return reply(
            `╭━━━〔 *📢 ʙʀᴏᴀᴅᴄᴀsᴛ* 〕━━━┈\n` +
            `┃ *Usage:*\n` +
            `┃ 📣 .broadcast <message>  → All groups\n` +
            `┃ 💬 .broadcast -dm <message> → All contacts\n` +
            `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        );

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const DELAY = parseInt(config.BROADCAST_DELAY) || 1500;

        // Fetch all chats
        let chats;
        try {
            chats = await conn.groupFetchAllParticipating();
        } catch (_) {
            chats = {};
        }

        const groups = Object.keys(chats); // Group JIDs

        // Get store contacts for DM
        let dmJids = [];
        if (isDM) {
            try {
                const contacts = conn.store?.contacts ? Object.keys(conn.store.contacts) : [];
                dmJids = contacts.filter(j => j.endsWith('@s.whatsapp.net') && j !== conn.user.id);
            } catch (_) {}
        }

        const targets = isDM ? dmJids : groups;
        let sent = 0, failed = 0;

        const broadcastMsg =
            `╭━━━〔 *📢 ɴᴏᴠᴀ_x ᴍɪɴɪ ʙʀᴏᴀᴅᴄᴀsᴛ* 〕━━━┈\n` +
            `┃\n┃ ${text}\n┃\n` +
            `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;

        for (const jid of targets) {
            try {
                await conn.sendMessage(jid, { text: broadcastMsg, contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363429597718924@newsletter',
                            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                            serverMessageId: 143
                        }
                    } });
                sent++;
                await new Promise(r => setTimeout(r, DELAY));
            } catch (_) {
                failed++;
            }
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        reply(
            `╭━━━〔 *📢 ʙʀᴏᴀᴅᴄᴀsᴛ ᴄᴏᴍPLᴇᴛᴇ* 〕━━━┈\n` +
            `┃ 📨 *Sent:* ${sent}\n` +
            `┃ ❌ *Failed:* ${failed}\n` +
            `┃ 📦 *Total targets:* ${targets.length}\n` +
            `┃ 🎯 *Mode:* ${isDM ? 'DM Contacts' : 'All Groups'}\n` +
            `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        );

    } catch (err) {
        console.error('[BROADCAST ERROR]', err.message);
        reply(`╭━━━〔 *❌ ʙʀᴏᴀᴅᴄᴀsᴛ ᴇʀʀᴏʀ* 〕━━━┈\n┃ *${err.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ── BROADCAST TOGGLE ──
cmd({
    pattern: 'bcset',
    desc: 'Enable/Disable broadcast feature',
    category: 'owner',
    react: '⚙️',
    use: '.bcset on/off',
    filename: __filename,
}, async (conn, mek, m, { isOwner, args, reply }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Owner only!*\n╰━━━━━━━━━━━━━━━┈`);

    const action = (args[0] || '').toLowerCase();
    if (action === 'on')  { config.BROADCAST_ENABLE = 'true';  return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ✅ *Broadcast ENABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`); }
    if (action === 'off') { config.BROADCAST_ENABLE = 'false'; return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Broadcast DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`); }

    reply(
        `╭━━━〔 *📢 ʙʀᴏᴀᴅᴄᴀsᴛ sᴇᴛᴛɪɴɢ* 〕━━━┈\n` +
        `┃ *Status:* ${config.BROADCAST_ENABLE === 'true' ? '✅ ON' : '❌ OFF'}\n` +
        `┃ *Delay:* ${config.BROADCAST_DELAY}ms\n` +
        `┃ *Usage:* .bcset on/off\n` +
        `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
    );
});
