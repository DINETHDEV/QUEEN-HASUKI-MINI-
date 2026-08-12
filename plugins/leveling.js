const { cmd } = require('../NovaX_Mini');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  🎮 LEVELING / XP SYSTEM — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Per-group XP tracking, levels and leaderboard
// ════════════════════════════════════════════════════════

// In-memory XP store: { `${group}::${sender}` => { xp, level, name } }
const xpStore = new Map();

/** Calculate required XP for a given level */
function xpForLevel(level) {
    return config.LEVELING_XP_BASE * level * level;
}

/** Get or create user XP record */
function getUser(group, sender, name) {
    const key = `${group}::${sender}`;
    if (!xpStore.has(key)) xpStore.set(key, { xp: 0, level: 0, name: name || sender.split('@')[0] });
    const user = xpStore.get(key);
    if (name) user.name = name;
    return user;
}

// ── XP EVENT HANDLER ──
cmd({
    on: 'body',
    pattern: null,
    desc: 'Leveling system XP handler',
    category: 'system',
    filename: __filename,
}, async (conn,  mek,  m, { text, isGroup, sender, pushname }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup) return;
        if (config.LEVELING_ENABLE !== 'true') return;

        const XP_PER_MSG = parseInt(config.LEVELING_XP_PER_MSG) || 5;
        const ANNOUNCE   = config.LEVELING_ANNOUNCE === 'true';

        // Add random XP (±2 variance)
        const earnedXp = XP_PER_MSG + Math.floor(Math.random() * 3) - 1;
        const user = getUser(from, sender, pushname);
        user.xp += earnedXp;

        // Check level up
        const nextLevelXp = xpForLevel(user.level + 1);
        if (user.xp >= nextLevelXp) {
            user.level++;
            user.xp -= nextLevelXp;
            xpStore.set(`${from}::${sender}`, user);

            if (ANNOUNCE) {
                await conn.sendMessage(from, {
                    text:
                        `╭━━━〔 *🎮 ʟᴇᴠᴇʟ ᴜᴘ!* 〕━━━┈\n` +
                        `┃ 🎉 @${sender.split('@')[0]}\n` +
                        `┃ 📈 *New Level: ${user.level}* 🏆\n` +
                        `┃ ⭐ *XP to Next:* ${xpForLevel(user.level + 1)}\n` +
                        `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
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
        } else {
            xpStore.set(`${from}::${sender}`, user);
        }
    } catch (_) {}
});

// ── VIEW RANK ──
cmd({
    pattern: 'rank',
    alias: ['level', 'xp', 'myrank'],
    desc: 'Check your XP rank and level',
    category: 'general',
    react: '🎮',
    filename: __filename,
}, async (conn,  mek,  m, { command, isGroup, sender, pushname, reply }) => {
    const from = mek.key.remoteJid;
    if (!isGroup) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group only command!*\n╰━━━━━━━━━━━━━━━┈`);
    if (config.LEVELING_ENABLE !== 'true') return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Leveling system is disabled.*\n╰━━━━━━━━━━━━━━━┈`);

    const user = getUser(from, sender, pushname);
    const nextXp = xpForLevel(user.level + 1);
    const progress = Math.floor((user.xp / nextXp) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    // Get rank position
    const groupUsers = [...xpStore.entries()]
        .filter(([k]) => k.startsWith(from + '::'))
        .sort((a, b) => (b[1].level * 1000 + b[1].xp) - (a[1].level * 1000 + a[1].xp));
    const rank = groupUsers.findIndex(([k]) => k === `${from}::${sender}`) + 1;

    reply(
        `╭━━━〔 *🎮 ʀᴀɴᴋ ᴄᴀʀᴅ* 〕━━━┈\n` +
        `┃ 👤 *${pushname || 'User'}*\n` +
        `┃ 🏆 *Level:* ${user.level}\n` +
        `┃ ⭐ *XP:* ${user.xp} / ${nextXp}\n` +
        `┃ 📊 *Progress:*\n` +
        `┃ [${bar}]\n` +
        `┃ 🥇 *Rank:* #${rank} in this group\n` +
        `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
    );
});

// ── LEADERBOARD ──
cmd({
    pattern: 'leaderboard',
    alias: ['lb', 'top'],
    desc: 'Show group XP leaderboard top 10',
    category: 'general',
    react: '🏆',
    filename: __filename,
}, async (conn,  mek,  m, { command, isGroup, reply }) => {
    const from = mek.key.remoteJid;
    if (!isGroup) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Group only command!*\n╰━━━━━━━━━━━━━━━┈`);
    if (config.LEVELING_ENABLE !== 'true') return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Leveling system is disabled.*\n╰━━━━━━━━━━━━━━━┈`);

    const groupUsers = [...xpStore.entries()]
        .filter(([k]) => k.startsWith(from + '::'))
        .sort((a, b) => (b[1].level * 1000 + b[1].xp) - (a[1].level * 1000 + a[1].xp))
        .slice(0, 10);

    if (!groupUsers.length) return reply(`╭━━━〔 *🏆 ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ* 〕━━━┈\n┃ *No data yet! Start chatting to earn XP!*\n╰━━━━━━━━━━━━━━━┈`);

    const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    let msg = `╭━━━〔 *🏆 ɢʀᴏᴜᴘ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ* 〕━━━┈\n`;
    groupUsers.forEach(([key, user], i) => {
        msg += `┃ ${MEDALS[i]} *${user.name}* — Lv.${user.level} (${user.xp} XP)\n`;
    });
    msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
    reply(msg);
});

// ── LEVEL TOGGLE ──
cmd({
    pattern: 'levelset',
    alias: ['xpset'],
    desc: 'Enable/disable the leveling system',
    category: 'owner',
    react: '⚙️',
    use: '.levelset on/off',
    filename: __filename,
}, async (conn, mek, m, { isOwner, args, reply }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Owner only!*\n╰━━━━━━━━━━━━━━━┈`);
    const action = (args[0] || '').toLowerCase();
    if (action === 'on')  { config.LEVELING_ENABLE = 'true';  return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ✅ *Leveling System ENABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`); }
    if (action === 'off') { config.LEVELING_ENABLE = 'false'; return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Leveling System DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`); }
    reply(`╭━━━〔 *🎮 ʟᴇᴠᴇʟɪɴɢ* 〕━━━┈\n┃ *Status:* ${config.LEVELING_ENABLE === 'true' ? '✅ ON' : '❌ OFF'}\n┃ *XP/Msg:* ${config.LEVELING_XP_PER_MSG}\n┃ *Base XP:* ${config.LEVELING_XP_BASE}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
});
