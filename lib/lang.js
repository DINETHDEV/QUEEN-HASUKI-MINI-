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
    LOADING:       '⏳ Loading...',
    SUCCESS:       '✅ Success',
    ERROR:         '❌ Error',

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
    PING_BTN:     '🏓 PING',

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
    MENU_PREFIX:   'Prefix',
    MENU_UPTIME:   'Uptime',
    MENU_CMDS:     'Commands',
    MENU_OWNER:    'Owner',
    NOT_FOUND:     'Not Found',

    // System
    SYS_TITLE:     'System Information',
    SYS_OS:        'Operating System',
    SYS_ARCH:      'Architecture',
    SYS_MEM:       'Memory',
};

// ── Sinhala ───────────────────────────────────────────────────────────────────
const SI = {
    // General
    BOT_INFO:      'බොට් තොරතුරු',
    PERFORMANCE:   'කාර්යාශූරත්වය',
    DATE_TIME:     'දිනය සහ වේලාව',
    NOVAX_ENGINE:  'NOVAX MINI',
    LOADING:       '⏳ පූරණය වෙමින්...',
    SUCCESS:       '✅ සාර්ථකයි',
    ERROR:         '❌ දෝෂයක්',

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
    PING_BTN:     '🏓 PING',

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
    MENU_PREFIX:   'උපසර්ගය',
    MENU_UPTIME:   'ක්‍රියාකාරී කාලය',
    MENU_CMDS:     'විධාන',
    MENU_OWNER:    'හිමිකරු',
    NOT_FOUND:     'හමු නොවීය',

    // System
    SYS_TITLE:     'පද්ධති තොරතුරු',
    SYS_OS:        'මෙහෙයුම් පද්ධතිය',
    SYS_ARCH:      'නිර්මාණ ශිල්පය',
    SYS_MEM:       'මතකය',
};

// ── Language map ──────────────────────────────────────────────────────────────
const LANGS = { en: EN, si: SI };

/**
 * Get language strings for a code.
 * Falls back to English for unknown codes.
 * Uses a safe Proxy to prevent crashes when accessing missing properties/methods.
 * @param {string} code  Language code ('en' | 'si')
 * @returns {object}     Language strings object
 */
function getLang(code) {
    const key = (code || 'en').toLowerCase().trim();
    const targetObj = LANGS[key] || LANGS.en;
    
    return new Proxy(targetObj, {
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }
            if (prop in LANGS.en) {
                return LANGS.en[prop];
            }
            // Safe fallback to prevent undefined string property/method crashes
            if (typeof prop === 'string') {
                return prop;
            }
            return undefined;
        }
    });
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
