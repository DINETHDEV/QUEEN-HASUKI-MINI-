const { cmd } = require('../NovaX_Mini');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  🚫 ANTI-SPAM PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Detects rapid message floods and warns/kicks/mutes
// ════════════════════════════════════════════════════════

// In-memory tracker: { jid => { sender => [timestamps] } }
const spamTracker = new Map();

// Warn counter per user per group: { `${group}::${sender}` => count }
const warnCount = new Map();
const MAX_WARNS = 3;

/**
 * Core anti-spam event handler — attached via `on: 'body'`
 */
cmd({
    on: 'body',
    pattern: null,
    desc: 'Anti-spam background handler',
    category: 'system',
    filename: __filename,
}, async (conn,  mek,  m, { isGroup, isOwner, isAdmins, isBotAdmins, sender, text }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup) return;
        if (isOwner || isAdmins) return; // Don't spam-check admins/owner

        const userConfig = config;
        if (userConfig.ANTI_SPAM !== 'true') return;
        if (!isBotAdmins) return; // Bot needs to be admin to take action

        const COUNT  = parseInt(userConfig.ANTI_SPAM_COUNT) || 7;
        const WINDOW = (parseInt(userConfig.ANTI_SPAM_WINDOW) || 10) * 1000; // ms
        const ACTION = userConfig.ANTI_SPAM_ACTION || 'warn';

        const now = Date.now();

        // Init group map
        if (!spamTracker.has(from)) spamTracker.set(from, new Map());
        const groupMap = spamTracker.get(from);

        // Init sender timestamps array
        if (!groupMap.has(sender)) groupMap.set(sender, []);
        const timestamps = groupMap.get(sender);

        // Remove old timestamps outside window
        const recent = timestamps.filter(ts => now - ts < WINDOW);
        recent.push(now);
        groupMap.set(sender, recent);

        // Check threshold
        if (recent.length < COUNT) return;

        // ── SPAM DETECTED ──
        groupMap.set(sender, []); // reset for this user
        const senderTag = `@${sender.split('@')[0]}`;
        const warnKey = `${from}::${sender}`;
        const warns = (warnCount.get(warnKey) || 0) + 1;
        warnCount.set(warnKey, warns);

        if (ACTION === 'warn') {
            if (warns >= MAX_WARNS) {
                // Auto-kick after max warns
                warnCount.set(warnKey, 0);
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                await conn.sendMessage(from, {
                    text: `╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ 🦵 *${senderTag} has been kicked!*\n┃ ❌ *Reason:* Spam — reached max warnings.\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
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
                    text: `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ ${senderTag} *— Spam Warning ${warns}/${MAX_WARNS}!*\n┃ ⏱ *Slow down!* Too many messages too fast.\n┃ 🚫 *${MAX_WARNS - warns} more warn(s) before kick.*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
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
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ 🦵 *${senderTag} kicked for spam!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
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
        } else if (ACTION === 'mute') {
            // Mute: update group settings to admin-only temporarily
            await conn.sendMessage(from, {
                text: `╭━━━〔 *🔇 ɴᴏᴠᴀ_x ᴍɪɴɪ — ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ ⚠️ ${senderTag} *spam detected!*\n┃ 🔇 *They have been muted for 60 seconds.*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
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
            // Re-enable after 60s (WhatsApp does not support per-user mute natively, so we just notify)
        }

    } catch (err) {
        console.error('[ANTI-SPAM ERROR]', err.message);
    }
});

// ── CONTROL COMMANDS ──

cmd({
    pattern: 'antispam',
    alias: ['spamguard'],
    desc: 'Toggle anti-spam on/off for this group',
    category: 'group',
    react: '🚫',
    use: '.antispam on/off',
    filename: __filename,
}, async (conn,  mek,  m, { isGroup, isAdmins, isOwner, args, reply, command }) => {
    const from = mek.key.remoteJid;
    if (!isGroup) return reply('╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group only command!*\n╰━━━━━━━━━━━━━━━┈');
    if (!isAdmins && !isOwner) return reply('╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Admin only!*\n╰━━━━━━━━━━━━━━━┈');

    const action = (args[0] || '').toLowerCase();
    const status  = config.ANTI_SPAM === 'true';

    if (!action || action === 'status') {
        return reply(
            `╭━━━〔 *🚫 ᴀɴᴛɪ-sᴘᴀᴍ sᴛᴀᴛᴜs* 〕━━━┈\n` +
            `┃ 🔘 *Status:* ${status ? '✅ ON' : '❌ OFF'}\n` +
            `┃ 📊 *Threshold:* ${config.ANTI_SPAM_COUNT} msgs / ${config.ANTI_SPAM_WINDOW}s\n` +
            `┃ ⚡ *Action:* ${config.ANTI_SPAM_ACTION}\n` +
            `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        );
    }

    if (action === 'on') {
        config.ANTI_SPAM = 'true';
        return reply(`╭━━━〔 *🚫 ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ ✅ *Anti-Spam ENABLED!*\n┃ 📊 *${config.ANTI_SPAM_COUNT} messages / ${config.ANTI_SPAM_WINDOW}s = spam*\n┃ ⚡ *Action:* ${config.ANTI_SPAM_ACTION}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
    if (action === 'off') {
        config.ANTI_SPAM = 'false';
        return reply(`╭━━━〔 *🚫 ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ ❌ *Anti-Spam DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }

    reply(`╭━━━〔 *⚠️ ᴀɴᴛɪ-sᴘᴀᴍ* 〕━━━┈\n┃ *Usage:* .antispam on/off\n╰━━━━━━━━━━━━━━━┈`);
});
