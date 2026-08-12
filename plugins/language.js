// ════════════════════════════════════════════════════════
//  🌐 LANGUAGE PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  User-facing language selection command
// ════════════════════════════════════════════════════════

const { cmd }                      = require('../NovaX_Mini');
const config                       = require('../config');
const { getUserLanguage,
        setUserLanguage }          = require('../lib/database');
const { sendInteractive, qr }      = require('../lib/interactive');
const { t }                        = require('../lib/language');

cmd({
    pattern:  'language',
    alias:    ['lang'],
    desc:     'Change your preferred language / භාෂාව වෙනස් කරන්න',
    category: 'general',
    react:    '🌐',
    filename: __filename
}, async (conn,  mek,  m, { from, sender, q, quoted, text }) => {
    // ── sender comes from the 4th context arg (set by main.js) ──────────
    // Never use m.sender — it is not reliably populated
    const jid    = sender || mek.key.participant || from;
    const prefix = config.PREFIX || '.';

    // ── Resolve current language ─────────────────────────────────────────
    let userLang = await getUserLanguage(jid);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    // ── Handle inline arg: .language en / .language si ──────────────────
    if (q) {
        const input = q.trim().toLowerCase();

        if (input === 'en' || input === 'english') {
            await setUserLanguage(jid, 'en');
            const msg =
                `╭━━〔 ✅ Language Updated 〕━━╮\n` +
                `┃\n` +
                `┃ 🌐 Language set to *English* 🇬🇧\n` +
                `┃ ✨ All responses will now be\n` +
                `┃    in English.\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━╯\n` +
                `> ${config.BOT_FOOTER || '© ɴᴏᴠᴀ_x ᴍɪɴɪ'}`;
            return conn.sendMessage(from, { text: msg }, { quoted: mek });
        }

        if (input === 'si' || input === 'sinhala') {
            await setUserLanguage(jid, 'si');
            const msg =
                `╭━━〔 ✅ භාෂාව යාවත්කාලීන විය 〕━━╮\n` +
                `┃\n` +
                `┃ 🇱🇰 භාෂාව *සිංහල* ලෙස සකසන ලදී\n` +
                `┃ ✨ ඉදිරි ප්‍රතිචාර සිංහලෙන්\n` +
                `┃    ලැබෙනු ඇත.\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━╯\n` +
                `> ${config.BOT_FOOTER || '© ɴᴏᴠᴀ_x ᴍɪɴɪ'}`;
            return conn.sendMessage(from, { text: msg }, { quoted: mek });
        }

        // Unknown code
        return conn.sendMessage(from, {
            text:
                `❌ *Invalid language code.*\n\n` +
                `Use:\n` +
                `• \`${prefix}language en\` — English 🇬🇧\n` +
                `• \`${prefix}language si\` — Sinhala 🇱🇰`
        }, { quoted: mek });
    }

    // ── Show language selection card ─────────────────────────────────────
    const currentName = userLang === 'si' ? 'Sinhala 🇱🇰' : 'English 🇬🇧';

    const body = userLang === 'si'
        ? `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — භාෂා සැකසුම් ★*\n\n` +
          ` 🌐 *වත්මන් භාෂාව:* ${currentName}\n\n` +
          ` ────────────────────────\n` +
          ` 📥 *පහත බොත්තම් මඟින් නව භාෂාවක් තෝරන්න:*`
        : `*★ ɴᴏᴠᴀ-x ᴍɪɴɪ — ʟᴀɴɢᴜᴀɢᴇ sᴇᴛᴛɪɴɢs ★*\n\n` +
          ` 🌐 *Current Language:* ${currentName}\n\n` +
          ` ────────────────────────\n` +
          ` 📥 *Select your preferred language below:*`;

    await sendInteractive(conn, from, mek, {
        imageUrl: config.IMAGE_PATH,
        title:    '🌐 NovaX Mini',
        body,
        footer:   config.BOT_FOOTER || '© ɴᴏᴠᴀ_x ᴍɪɴɪ',
        buttons: [
            qr('🇬🇧 English',          `${prefix}language en`),
            qr('🇱🇰 සිංහල (Sinhala)', `${prefix}language si`)
        ]
    });
});
