const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

// ════════════════════════════════════════════════════════
//  🌐 AUTO TRANSLATE PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Automatically translates incoming messages
// ════════════════════════════════════════════════════════

cmd({
    on: 'body',
    pattern: null,
    desc: 'Auto translate background handler',
    category: 'system',
    filename: __filename,
}, async (conn,  mek,  m, { body, q, isGroup, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (config.AUTO_TRANSLATE !== 'true' || !body) return;
        if (config.AUTO_TRANSLATE_GROUPS_ONLY === 'true' && !isGroup) return;
        
        // Don't translate commands
        if (body.startsWith(config.PREFIX)) return;

        const targetLang = config.AUTO_TRANSLATE_LANG || 'en';
        
        // Use free google translation API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(body)}`;
        const response = await axios.get(url);
        
        if (!response.data || !response.data[0] || !response.data[0][0]) return;
        const translatedText = response.data[0][0][0];

        // Check if the original message is already in the target language
        if (translatedText.toLowerCase() === body.toLowerCase()) return;

        await reply(`╭━━━〔 *🌐 ᴀᴜᴛᴏ ᴛʀᴀɴsʟᴀᴛᴇ* 〕━━━┈\n┃ *Translated to ${targetLang.toUpperCase()}:*\n┃ ${translatedText}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

    } catch (err) {
        console.error('[AUTO-TRANSLATE ERROR]', err.message);
    }
});

// ── CONTROL COMMANDS ──

cmd({
    pattern: 'atset',
    alias: ['autotranslate'],
    desc: 'Toggle auto translate on/off',
    category: 'owner',
    react: '🌐',
    use: '.atset on/off <lang>',
    filename: __filename,
}, async (conn, mek, m, { isOwner, args, reply }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply('╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *Owner only!*\n╰━━━━━━━━━━━━━━━┈');

    const action = (args[0] || '').toLowerCase();
    
    if (action === 'on') {
        config.AUTO_TRANSLATE = 'true';
        if (args[1]) config.AUTO_TRANSLATE_LANG = args[1].toLowerCase();
        return reply(`╭━━━〔 *🌐 ᴀᴜᴛᴏ ᴛʀᴀɴsʟᴀᴛᴇ* 〕━━━┈\n┃ ✅ *Auto Translate ENABLED!*\n┃ 🎯 *Target Language:* ${config.AUTO_TRANSLATE_LANG.toUpperCase()}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
    
    if (action === 'off') {
        config.AUTO_TRANSLATE = 'false';
        return reply(`╭━━━〔 *🌐 ᴀᴜᴛᴏ ᴛʀᴀɴsʟᴀᴛᴇ* 〕━━━┈\n┃ ❌ *Auto Translate DISABLED!*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }

    reply(
        `╭━━━〔 *🌐 ᴀᴜᴛᴏ ᴛʀᴀɴsʟᴀᴛᴇ sᴛᴀᴛᴜs* 〕━━━┈\n` +
        `┃ 🔘 *Status:* ${config.AUTO_TRANSLATE === 'true' ? '✅ ON' : '❌ OFF'}\n` +
        `┃ 🎯 *Language:* ${config.AUTO_TRANSLATE_LANG.toUpperCase()}\n` +
        `┃ *Usage:* .atset on/off [lang]\n` +
        `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
    );
});
