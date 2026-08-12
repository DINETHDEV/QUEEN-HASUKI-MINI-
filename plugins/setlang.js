// ════════════════════════════════════════════════════════
//  🌐 SETLANG PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Owner-only: change the bot's global default language
// ════════════════════════════════════════════════════════

const { cmd }  = require('../NovaX_Mini');
const config   = require('../config');
const { t }    = require('../lib/language');

const SUPPORTED  = ['en', 'si'];
const LANG_NAMES = { en: 'English 🇬🇧', si: 'Sinhala 🇱🇰' };

cmd({
    pattern:  'setlang',
    alias:    ['setlanguage', 'botlang'],
    react:    '🌐',
    desc:     'Set bot default language (owner only)',
    category: 'owner',
    filename: __filename
// sender, isOwner, q all come from the 4th context object built by main.js
}, async (conn,  mek,  m, { from, sender, isOwner, q, quoted, command, text }) => {

    if (!isOwner) {
        return conn.sendMessage(from, {
            text: `⛔ *This command is for the bot owner only.*`
        }, { quoted: mek });
    }

    // No argument → show current + usage
    if (!q) {
        const cur = (config.LANGUAGE || 'en').toLowerCase();
        return conn.sendMessage(from, {
            text:
                `╭━━〔 🌐 *Bot Language Settings* 〕━━╮\n` +
                `┃\n` +
                `┃ 🔤 *Current:* ${LANG_NAMES[cur] || cur.toUpperCase()}\n` +
                `┃\n` +
                `┃ 📋 *Available:*\n` +
                `┃   • \`en\` — English 🇬🇧\n` +
                `┃   • \`si\` — Sinhala 🇱🇰\n` +
                `┃\n` +
                `┃ 💡 Usage: .setlang <code>\n` +
                `┃   Example: .setlang si\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━╯\n` +
                `> ${config.BOT_FOOTER || '© ɴᴏᴠᴀ_x ᴍɪɴɪ'}`
        }, { quoted: mek });
    }

    const input = q.trim().toLowerCase();

    if (!SUPPORTED.includes(input)) {
        return conn.sendMessage(from, {
            text:
                `❌ *Invalid language code.*\n\n` +
                `Supported:\n• \`en\` — English 🇬🇧\n• \`si\` — Sinhala 🇱🇰\n\n` +
                `Usage: \`.setlang en\` or \`.setlang si\``
        }, { quoted: mek });
    }

    // Apply at runtime
    config.LANGUAGE = input.toUpperCase();

    // Flush language cache so new default takes effect immediately
    try { require('../lib/language')._clearCache(); } catch (_) {}

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    return conn.sendMessage(from, {
        text:
            `╭━━〔 ✅ *Language Updated* 〕━━╮\n` +
            `┃\n` +
            `┃ 🌐 *Bot default set to:*\n` +
            `┃   ${LANG_NAMES[input]}\n` +
            `┃\n` +
            `┃ ⚡ Users without a personal\n` +
            `┃   language will now get\n` +
            `┃   *${LANG_NAMES[input]}* responses.\n` +
            `┃\n` +
            `┃ 💡 Users can override with\n` +
            `┃   \`.language\`\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━╯\n` +
            `> ${config.BOT_FOOTER || '© ɴᴏᴠᴀ_x ᴍɪɴɪ'}`
    }, { quoted: mek });
});
