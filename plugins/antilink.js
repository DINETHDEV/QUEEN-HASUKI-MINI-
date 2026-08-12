const { cmd } = require('../NovaX_Mini');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  🔗 ANTI-LINK PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Detects and handles URL/group links in groups
// ════════════════════════════════════════════════════════

// URL detection patterns
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
const WA_LINK_REGEX = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/gi;

// Warn counter: { `${group}::${sender}` => count }
const linkWarnCount = new Map();
const MAX_WARNS = 2;

cmd({
    on: 'body',
    pattern: null,
    desc: 'Anti-link background handler',
    category: 'system',
    filename: __filename,
}, async (conn,  mek,  m, { isGroup, body, isOwner, isAdmins, isBotAdmins, sender, text }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup || !body) return;
        if (isOwner || isAdmins) return; // Admins can post links
        if (config.ANTI_LINK !== 'true') return;
        if (!isBotAdmins) return;

        const ACTION  = config.ANTI_LINK_ACTION  || 'delete';
        const BLOCK_WA = config.ANTI_LINK_WA === 'true';

        const hasUrl     = URL_REGEX.test(body);
        const hasWaLink  = WA_LINK_REGEX.test(body);

        // Reset regex lastIndex (stateful)
        URL_REGEX.lastIndex = 0;
        WA_LINK_REGEX.lastIndex = 0;

        if (!hasUrl && !hasWaLink) return;
        if (hasWaLink && !BLOCK_WA && !hasUrl) return;

        const senderTag = `@${sender.split('@')[0]}`;
        const warnKey   = `${from}::${sender}`;
        const warns     = (linkWarnCount.get(warnKey) || 0) + 1;
        linkWarnCount.set(warnKey, warns);

        // Always delete the message first
        try { await conn.sendMessage(from, { delete: mek.key }); } catch (_) {}

        if (ACTION === 'delete' || ACTION === 'warn') {
            if (warns >= MAX_WARNS) {
                linkWarnCount.set(warnKey, 0);
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                await conn.sendMessage(from, {
                    text: `╭━━━〔 *🔗 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ 🦵 *${senderTag} kicked!*\n┃ ❌ *Reason:* Repeated link posting.\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
                    mentions: [sender],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363429597718924@newsletter',
                            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                            serverMessageId: 143
                        }
                    }
                });
            } else {
                await conn.sendMessage(from, {
                    text: `╭━━━〔 *🔗 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ ⚠️ ${senderTag} *— Link Deleted!*\n┃ 🚫 *Links are not allowed in this group.*\n┃ ⚠️ *Warning ${warns}/${MAX_WARNS}*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
                    mentions: [sender],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363429597718924@newsletter',
                            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                            serverMessageId: 143
                        }
                    }
                });
            }
        } else if (ACTION === 'kick') {
            linkWarnCount.set(warnKey, 0);
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `╭━━━〔 *🔗 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ 🦵 *${senderTag} kicked for posting a link!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
                mentions: [sender],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363429597718924@newsletter',
                            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                            serverMessageId: 143
                        }
                    }
                });
        }

    } catch (err) {
        console.error('[ANTI-LINK ERROR]', err.message);
    }
});

// ── CONTROL COMMANDS ──

cmd({
    pattern: 'antilink',
    desc: 'Toggle anti-link protection on/off',
    category: 'group',
    react: '🔗',
    use: '.antilink on/off',
    filename: __filename,
}, async (conn,  mek,  m, { isGroup, isAdmins, isOwner, args, reply, command }) => {
    const from = mek.key.remoteJid;
    if (!isGroup) return reply('╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group only command!*\n╰━━━━━━━━━━━━━━━┈');
    if (!isAdmins && !isOwner) return reply('╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Admin only!*\n╰━━━━━━━━━━━━━━━┈');

    const action = (args[0] || '').toLowerCase();
    const status  = config.ANTI_LINK === 'true';

    if (!action || action === 'status') {
        return reply(
            `╭━━━〔 *🔗 ᴀɴᴛɪ-ʟɪɴᴋ sᴛᴀᴛᴜs* 〕━━━┈\n` +
            `┃ 🔘 *Status:* ${status ? '✅ ON' : '❌ OFF'}\n` +
            `┃ ⚡ *Action:* ${config.ANTI_LINK_ACTION}\n` +
            `┃ 💬 *Block WA Links:* ${config.ANTI_LINK_WA === 'true' ? 'Yes' : 'No'}\n` +
            `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        );
    }

    if (action === 'on') {
        config.ANTI_LINK = 'true';
        return reply(`╭━━━〔 *🔗 ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ ✅ *Anti-Link ENABLED!*\n┃ 🗑️ *Action:* ${config.ANTI_LINK_ACTION}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
    if (action === 'off') {
        config.ANTI_LINK = 'false';
        return reply(`╭━━━〔 *🔗 ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ ❌ *Anti-Link DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
    if (action === 'wa') {
        config.ANTI_LINK_WA = config.ANTI_LINK_WA === 'true' ? 'false' : 'true';
        return reply(`╭━━━〔 *🔗 ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ *WA Group Links:* ${config.ANTI_LINK_WA === 'true' ? '✅ Blocked' : '❌ Allowed'}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }

    reply(`╭━━━〔 *⚠️ ᴀɴᴛɪ-ʟɪɴᴋ* 〕━━━┈\n┃ *Usage:* .antilink on/off/wa\n╰━━━━━━━━━━━━━━━┈`);
});
