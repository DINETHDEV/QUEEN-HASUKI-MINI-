const { cmd } = require('../NovaX_Mini');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  💬 CUSTOM AUTO REPLY PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Replies automatically to specific keywords
// ════════════════════════════════════════════════════════

cmd({
    on: 'body',
    pattern: null,
    desc: 'Auto reply background handler',
    category: 'system',
    filename: __filename,
}, async (conn, mek, m, { body, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (config.AUTO_REPLY_ENABLE !== 'true' || !body) return;

        const text = body.toLowerCase().trim();
        const autoReplies = config.AUTO_REPLY_DEFAULT || [];

        const match = autoReplies.find(item => text === item.keyword.toLowerCase());
        
        if (match) {
            await reply(`╭━━━〔 *🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ ᴀᴜᴛᴏ ʀᴇᴘʟʏ* 〕━━━┈\n┃ ${match.reply}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        }
    } catch (err) {
        console.error('[AUTO-REPLY ERROR]', err.message);
    }
});

// ── CONTROL COMMANDS ──

cmd({
    pattern: 'arset',
    alias: ['autoreply'],
    desc: 'Toggle auto reply on/off',
    category: 'owner',
    react: '💬',
    use: '.arset on/off',
    filename: __filename,
}, async (conn, mek, m, { isOwner, args, reply }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply('╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Owner only!*\n╰━━━━━━━━━━━━━━━┈');

    const action = (args[0] || '').toLowerCase();
    
    if (action === 'on') {
        config.AUTO_REPLY_ENABLE = 'true';
        return reply(`╭━━━〔 *💬 ᴀᴜᴛᴏ ʀᴇᴘʟʏ* 〕━━━┈\n┃ ✅ *Auto Reply ENABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
    
    if (action === 'off') {
        config.AUTO_REPLY_ENABLE = 'false';
        return reply(`╭━━━〔 *💬 ᴀᴜᴛᴏ ʀᴇᴘʟʏ* 〕━━━┈\n┃ ❌ *Auto Reply DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }

    reply(
        `╭━━━〔 *💬 ᴀᴜᴛᴏ ʀᴇᴘʟʏ sᴛᴀᴛᴜs* 〕━━━┈\n` +
        `┃ 🔘 *Status:* ${config.AUTO_REPLY_ENABLE === 'true' ? '✅ ON' : '❌ OFF'}\n` +
        `┃ *Usage:* .arset on/off\n` +
        `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
    );
});
