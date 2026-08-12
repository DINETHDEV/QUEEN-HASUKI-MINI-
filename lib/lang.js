/**
 * NovaX Bot — Language System
 * Supports: English (en) | Sinhala (si)
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

// ── English ───────────────────────────────────────────────────────────────────
const EN = {
    // General
    BOT_INFO:      'BOT INFO',
    PERFORMANCE:   'PERFORMANCE',
    DATE_TIME:     'DATE & TIME',
    NOVAX_ENGINE:  'NOVAX MINI',

    // Status
    STATUS_ONLINE:  'ONLINE ✅',
    STATUS_OFFLINE: 'OFFLINE ❌',

    // Alive / Ping
    ALIVE_MSG:    '🤖 I am alive and running!',
    ALIVE_BTN:    '⚡ ALIVE',
    PING_TITLE:   'PING RESULTS',
    PING_RES:     'Response',
    PING_CPU:     'CPU',
    PING_PLATFORM:'Platform',
    PING_STATUS:  'Status',
    PING_ONLINE:  'Online ✅',
    PING_REFRESH: '🏓 PING',
    MENU_BTN:     '📋 MENU',

    // Buttons
    PREMIUM_BOT: '✨ Premium WhatsApp Bot',
    FAST_RESP:   '⚡ Fast Response',
    STABLE:      '🔥 Stable Performance',
    SECURE:      '🛡 Secure System',

    // Errors
    OWNER_ONLY:   '🚫 This command is only for the Owner!',
    GROUP_ONLY:   '❌ This command can only be used in groups.',
    ADMIN_ONLY:   '❌ Only group admins can use this command.',
    BOT_ADMIN:    '❌ I need to be an admin to do that.',
    INVALID_CMD:  '❌ Invalid command usage.',
    ERROR_RETRY:  '❌ An error occurred. Please try again.',

    // Settings
    SETTINGS_UPDATED: '✅ Setting updated successfully!',
    SETTINGS_FAILED:  '❌ Failed to update setting.',

    // Language
    LANG_UPDATED_EN: '✅ Language set to English 🇬🇧',
    LANG_UPDATED_SI: '✅ Language set to Sinhala 🇱🇰',

    // Menu
    MENU_TITLE:    '📋 COMMAND MENU',
    MENU_FOOTER:   'Type a command to get started!',
    MENU_OWNER:    'Contact Owner',
    MENU_UPTIME:   'Uptime',
    MENU_CMDS:     'Commands',
    MENU_PREFIX:   'Prefix',

    // Status / Response
    LOADING:   '⏳',
    SUCCESS:   '✅',
    ERROR:     '❌',
    NOT_FOUND: 'Not Found',

    // Navigation Buttons
    PING_BTN:  '🏓 PING',

    // System Info
    SYS_TITLE: '🖥️ SYSTEM INFO',
    SYS_OS:    '🖥️ OS INFO',
    SYS_ARCH:  'Architecture',
    SYS_MEM:   'Memory',
};

// ── Sinhala ───────────────────────────────────────────────────────────────────
const SI = {
    // General
    BOT_INFO:      'බොට් තොරතුරු',
    PERFORMANCE:   'කාර්යාශූරත්වය',
    DATE_TIME:     'දිනය සහ වේලාව',
    NOVAX_ENGINE:  'NOVAX MINI',

    // Status
    STATUS_ONLINE:  'සබිත ✅',
    STATUS_OFFLINE: 'නොසබිත ❌',

    // Alive / Ping
    ALIVE_MSG:    '🤖 මම සක්‍රිය සහ ක්‍රියාත්මකයි!',
    ALIVE_BTN:    '⚡ සක්‍රිය',
    PING_TITLE:   'PING ප්‍රතිඵල',
    PING_RES:     'ප්‍රතිචාරය',
    PING_CPU:     'CPU',
    PING_PLATFORM:'වේදිකාව',
    PING_STATUS:  'තත්ත්වය',
    PING_ONLINE:  'සබිත ✅',
    PING_REFRESH: '🏓 PING',
    MENU_BTN:     '📋 මෙනු',

    // Buttons
    PREMIUM_BOT: '✨ ප්‍රිමියම් WhatsApp බොට්',
    FAST_RESP:   '⚡ වේගවත් ප්‍රතිචාරය',
    STABLE:      '🔥 ස්ථාවර කාර්ය සාධනය',
    SECURE:      '🛡 ආරක්ෂිත පද්ධතිය',

    // Errors
    OWNER_ONLY:   '🚫 මෙම විධානය හිමිකාරිට පමණයි!',
    GROUP_ONLY:   '❌ මෙම විධානය කණ්ඩායමක් තුළ පමණ භාවිතා කළ හැකිය.',
    ADMIN_ONLY:   '❌ මෙම විධානය පරිපාලකයින්ට පමණයි.',
    BOT_ADMIN:    '❌ ඒ කිරීමට මට ඇඩ්මින් ධාරිතාවය අවශ්‍යයි.',
    INVALID_CMD:  '❌ අවලංගු විධාන භාවිතය.',
    ERROR_RETRY:  '❌ දෝෂයක් ඇතිවිය. නැවත උත්සාහ කරන්න.',

    // Settings
    SETTINGS_UPDATED: '✅ සැකසුම සාර්ථකව යාවත්කාලීන කරන ලදී!',
    SETTINGS_FAILED:  '❌ සැකසුම යාවත්කාලීන කිරීමට අසමත් විය.',

    // Language
    LANG_UPDATED_EN: '✅ භාෂාව ඉංග්‍රීසි ලෙස සකසන ලදී 🇬🇧',
    LANG_UPDATED_SI: '✅ භාෂාව සිංහල ලෙස සකසන ලදී 🇱🇰',

    // Menu
    MENU_TITLE:    '📋 විධාන මෙනු',
    MENU_FOOTER:   'ආරම්භ කිරීමට විධානයක් ටයිප් කරන්න!',
    MENU_OWNER:    'හිමිකාරි අමතන්න',
    MENU_UPTIME:   'ක්‍රියාකාල',
    MENU_CMDS:     'විධාන',
    MENU_PREFIX:   'උපසර්ගය',

    // Status / Response
    LOADING:   '⏳',
    SUCCESS:   '✅',
    ERROR:     '❌',
    NOT_FOUND: 'හමු නොවිණි',

    // Navigation Buttons
    PING_BTN:  '🏓 PING',

    // System Info
    SYS_TITLE: '🖥️ පද්ධතිය',
    SYS_OS:    '🖥️ OS',
    SYS_ARCH:  'ගෘහ නිර්මාණ',
    SYS_MEM:   'මතකය',
};

// ── Language map ──────────────────────────────────────────────────────────────
const LANGS = { en: EN, si: SI };

/**
 * Get language strings for a code.
 * Falls back to English for unknown codes.
 * @param {string} code  Language code ('en' | 'si')
 * @returns {object}     Language strings object
 */
function getLang(code) {
    const key = (code || 'en').toLowerCase().trim();
    return LANGS[key] || LANGS.en;
}

/**
 * Quick translate shorthand.
 * @param {string} key      String key
 * @param {string} langCode Language code
 * @returns {string}        Translated string or key if not found
 */
function t(key, langCode = 'en') {
    const lang = getLang(langCode);
    return lang[key] || EN[key] || key;
}

module.exports = { getLang, t, LANGS, EN, SI };
