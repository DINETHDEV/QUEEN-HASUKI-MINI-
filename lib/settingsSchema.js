/**
 * NovaX Mini — Bot Settings Schema / Registry
 *
 * This is the single source of truth for every dashboard-editable setting.
 * Each entry defines:
 *   key         – unique setting identifier (matches config/env key)
 *   type        – data type: 'boolean' | 'string' | 'number' | 'select' | 'array' | 'json'
 *   category    – UI group: general | status | presence | group | security | antispam |
 *                            antilink | broadcast | leveling | autoreply | autobio | media
 *   default     – default value (used for migration + reset)
 *   label       – human-readable label for the UI
 *   description – tooltip / help text
 *   options     – (select only) allowed values
 *   min         – (number only) minimum allowed value
 *   max         – (number only) maximum allowed value
 *   validate    – optional extra validation function
 *
 * SECURITY NOTE:
 *   Sensitive values (JWT_SECRET, MONGODB_URI, SMTP_PASS, ADMIN_PASSWORD, etc.)
 *   are NOT listed here and therefore CANNOT be modified through the dashboard API.
 *   The adminSettings route validates every incoming key against this schema.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

// ── Type helpers ──────────────────────────────────────────────────────────────

/**
 * Safely parse a boolean from any input.
 * Avoids Boolean("false") === true trap.
 */
function parseBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    if (typeof val === 'number') return val !== 0;
    return false;
}

/**
 * Safely parse a number with a fallback default.
 */
function parseNum(val, fallback = 0) {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize and validate a value against its schema entry.
 * Returns { ok: true, value } or { ok: false, error: string }.
 */
function normalizeValue(schema, rawValue) {
    if (rawValue === undefined || rawValue === null) {
        return { ok: true, value: schema.default };
    }

    switch (schema.type) {
        case 'boolean': {
            return { ok: true, value: parseBool(rawValue) };
        }

        case 'number': {
            const n = parseNum(rawValue, schema.default);
            if (!Number.isFinite(n)) {
                return { ok: false, error: `${schema.key} must be a valid number` };
            }
            if (schema.min !== undefined && n < schema.min) {
                return { ok: false, error: `${schema.key} must be >= ${schema.min}` };
            }
            if (schema.max !== undefined && n > schema.max) {
                return { ok: false, error: `${schema.key} must be <= ${schema.max}` };
            }
            return { ok: true, value: n };
        }

        case 'select': {
            const str = String(rawValue).trim();
            if (!schema.options.includes(str)) {
                return { ok: false, error: `${schema.key} must be one of: ${schema.options.join(', ')}` };
            }
            return { ok: true, value: str };
        }

        case 'string': {
            const str = String(rawValue ?? '').trim();
            if (schema.maxLength && str.length > schema.maxLength) {
                return { ok: false, error: `${schema.key} must be <= ${schema.maxLength} characters` };
            }
            return { ok: true, value: str };
        }

        case 'array': {
            if (typeof rawValue === 'string') {
                try { rawValue = JSON.parse(rawValue); } catch (_) {
                    // Treat as comma-separated
                    rawValue = rawValue.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            if (!Array.isArray(rawValue)) {
                return { ok: false, error: `${schema.key} must be an array` };
            }
            // Validate each element if itemType specified
            if (schema.itemType === 'string') {
                const cleaned = rawValue.map(v => String(v).trim()).filter(Boolean);
                return { ok: true, value: cleaned };
            }
            return { ok: true, value: rawValue };
        }

        case 'json': {
            if (typeof rawValue === 'string') {
                try { rawValue = JSON.parse(rawValue); } catch (_) {
                    return { ok: false, error: `${schema.key} must be valid JSON` };
                }
            }
            if (!Array.isArray(rawValue) && typeof rawValue !== 'object') {
                return { ok: false, error: `${schema.key} must be a JSON object or array` };
            }
            // Validate auto-reply entries if applicable
            if (schema.key === 'AUTO_REPLY_DEFAULT' && Array.isArray(rawValue)) {
                for (const entry of rawValue) {
                    if (typeof entry.keyword !== 'string' || typeof entry.reply !== 'string') {
                        return { ok: false, error: 'AUTO_REPLY_DEFAULT entries must have keyword and reply strings' };
                    }
                }
            }
            return { ok: true, value: rawValue };
        }

        default:
            return { ok: true, value: rawValue };
    }
}

// ── Settings Schema ───────────────────────────────────────────────────────────

const SETTINGS_SCHEMA = {

    // ── General ──────────────────────────────────────────────────────────────
    WORK_TYPE: {
        key:         'WORK_TYPE',
        type:        'select',
        category:    'general',
        label:       'Work Mode',
        description: 'Controls who can use bot commands',
        default:     'public',
        options:     ['public', 'private', 'groups', 'inbox']
    },

    LANGUAGE: {
        key:         'LANGUAGE',
        type:        'select',
        category:    'general',
        label:       'Language',
        description: 'Bot response language',
        default:     'EN',
        options:     ['EN', 'SI']
    },

    // ── Status Automation ─────────────────────────────────────────────────────
    AUTO_VIEW_STATUS: {
        key:         'AUTO_VIEW_STATUS',
        type:        'boolean',
        category:    'status',
        label:       'Auto View Status',
        description: 'Automatically view contacts\' status updates',
        default:     true
    },

    AUTO_LIKE_STATUS: {
        key:         'AUTO_LIKE_STATUS',
        type:        'boolean',
        category:    'status',
        label:       'Auto Like Status',
        description: 'Automatically react to status updates',
        default:     true
    },

    AUTO_LIKE_EMOJI: {
        key:         'AUTO_LIKE_EMOJI',
        type:        'array',
        itemType:    'string',
        category:    'status',
        label:       'Like Emojis',
        description: 'Emoji pool used for auto status reactions',
        default:     ['❤️', '🌹', '✨', '🥰', '😍', '💞', '💕', '☺️', '🤗', '🧩']
    },

    AUTO_STATUS_REPLY: {
        key:         'AUTO_STATUS_REPLY',
        type:        'boolean',
        category:    'status',
        label:       'Auto Reply to Status',
        description: 'Automatically reply to status updates with a message',
        default:     false
    },

    AUTO_STATUS_MSG: {
        key:         'AUTO_STATUS_MSG',
        type:        'string',
        category:    'status',
        label:       'Status Reply Message',
        description: 'Message sent as reply to status updates',
        default:     '🤗',
        maxLength:   500
    },

    // ── Presence & Chat ───────────────────────────────────────────────────────
    READ_MESSAGE: {
        key:         'READ_MESSAGE',
        type:        'boolean',
        category:    'presence',
        label:       'Auto Read Messages',
        description: 'Automatically mark incoming messages as read (blue tick)',
        default:     false
    },

    AUTO_TYPING: {
        key:         'AUTO_TYPING',
        type:        'boolean',
        category:    'presence',
        label:       'Auto Typing Indicator',
        description: 'Show typing indicator when processing messages',
        default:     false
    },

    AUTO_RECORDING: {
        key:         'AUTO_RECORDING',
        type:        'boolean',
        category:    'presence',
        label:       'Auto Recording Indicator',
        description: 'Show recording indicator when processing messages',
        default:     false
    },

    // ── Group Management ──────────────────────────────────────────────────────
    WELCOME_ENABLE: {
        key:         'WELCOME_ENABLE',
        type:        'boolean',
        category:    'group',
        label:       'Welcome Messages',
        description: 'Send welcome message when new member joins a group',
        default:     true
    },

    GOODBYE_ENABLE: {
        key:         'GOODBYE_ENABLE',
        type:        'boolean',
        category:    'group',
        label:       'Goodbye Messages',
        description: 'Send goodbye message when a member leaves a group',
        default:     true
    },

    WELCOME_MSG: {
        key:         'WELCOME_MSG',
        type:        'string',
        category:    'group',
        label:       'Welcome Message',
        description: 'Custom welcome message text. Leave empty for default.',
        default:     '',
        maxLength:   1000
    },

    GOODBYE_MSG: {
        key:         'GOODBYE_MSG',
        type:        'string',
        category:    'group',
        label:       'Goodbye Message',
        description: 'Custom goodbye message text. Leave empty for default.',
        default:     '',
        maxLength:   1000
    },

    WELCOME_IMAGE: {
        key:         'WELCOME_IMAGE',
        type:        'string',
        category:    'group',
        label:       'Welcome Image URL',
        description: 'Image URL to send with welcome messages',
        default:     '',
        maxLength:   500
    },

    GOODBYE_IMAGE: {
        key:         'GOODBYE_IMAGE',
        type:        'string',
        category:    'group',
        label:       'Goodbye Image URL',
        description: 'Image URL to send with goodbye messages',
        default:     '',
        maxLength:   500
    },

    GROUP_INVITE_LINK: {
        key:         'GROUP_INVITE_LINK',
        type:        'string',
        category:    'group',
        label:       'Group Invite Link',
        description: 'Default group invite link shown in group-related messages',
        default:     '',
        maxLength:   500
    },

    // ── Security / Anti-Call ──────────────────────────────────────────────────
    ANTI_CALL: {
        key:         'ANTI_CALL',
        type:        'boolean',
        category:    'security',
        label:       'Anti-Call',
        description: 'Automatically reject all incoming WhatsApp calls',
        default:     false
    },

    REJECT_MSG: {
        key:         'REJECT_MSG',
        type:        'string',
        category:    'security',
        label:       'Call Reject Message',
        description: 'Message sent to caller when a call is auto-rejected',
        default:     '*CALL LATER PLEASE ☺️🌹*',
        maxLength:   500
    },

    // ── Media & Links ─────────────────────────────────────────────────────────
    IMAGE_PATH: {
        key:         'IMAGE_PATH',
        type:        'string',
        category:    'media',
        label:       'Bot Banner Image URL',
        description: 'Default image shown in bot interactive messages',
        default:     'https://files.catbox.moe/aeg27n.png',
        maxLength:   500
    },

    CHANNEL_LINK: {
        key:         'CHANNEL_LINK',
        type:        'string',
        category:    'media',
        label:       'WhatsApp Channel Link',
        description: 'Official bot/owner WhatsApp channel link',
        default:     'https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A',
        maxLength:   500
    },

    // ── Anti-Spam ─────────────────────────────────────────────────────────────
    ANTI_SPAM: {
        key:         'ANTI_SPAM',
        type:        'boolean',
        category:    'antispam',
        label:       'Anti-Spam',
        description: 'Detect and act on spamming users in groups',
        default:     false
    },

    ANTI_SPAM_COUNT: {
        key:         'ANTI_SPAM_COUNT',
        type:        'number',
        category:    'antispam',
        label:       'Spam Message Threshold',
        description: 'Number of messages within the window that triggers spam detection',
        default:     7,
        min:         1,
        max:         100
    },

    ANTI_SPAM_WINDOW: {
        key:         'ANTI_SPAM_WINDOW',
        type:        'number',
        category:    'antispam',
        label:       'Spam Time Window (seconds)',
        description: 'Time window in seconds for counting spam messages',
        default:     10,
        min:         1,
        max:         3600
    },

    ANTI_SPAM_ACTION: {
        key:         'ANTI_SPAM_ACTION',
        type:        'select',
        category:    'antispam',
        label:       'Spam Action',
        description: 'Action to take when spam is detected',
        default:     'warn',
        options:     ['warn', 'kick', 'mute']
    },

    // ── Anti-Link ─────────────────────────────────────────────────────────────
    ANTI_LINK: {
        key:         'ANTI_LINK',
        type:        'boolean',
        category:    'antilink',
        label:       'Anti-Link',
        description: 'Detect and act on link sharing in groups',
        default:     false
    },

    ANTI_LINK_ACTION: {
        key:         'ANTI_LINK_ACTION',
        type:        'select',
        category:    'antilink',
        label:       'Anti-Link Action',
        description: 'Action to take when a link is detected',
        default:     'delete',
        options:     ['delete', 'kick', 'warn']
    },

    ANTI_LINK_WA: {
        key:         'ANTI_LINK_WA',
        type:        'boolean',
        category:    'antilink',
        label:       'Block WhatsApp Group Links',
        description: 'Also block WhatsApp group invite links (wa.me and chat.whatsapp.com)',
        default:     true
    },

    // ── Broadcast ─────────────────────────────────────────────────────────────
    BROADCAST_ENABLE: {
        key:         'BROADCAST_ENABLE',
        type:        'boolean',
        category:    'broadcast',
        label:       'Broadcast',
        description: 'Enable the broadcast feature for sending messages to multiple chats',
        default:     true
    },

    BROADCAST_DELAY: {
        key:         'BROADCAST_DELAY',
        type:        'number',
        category:    'broadcast',
        label:       'Broadcast Delay (ms)',
        description: 'Delay between each broadcast message in milliseconds',
        default:     1500,
        min:         0,
        max:         60000
    },

    // ── Leveling ──────────────────────────────────────────────────────────────
    LEVELING_ENABLE: {
        key:         'LEVELING_ENABLE',
        type:        'boolean',
        category:    'leveling',
        label:       'Leveling System',
        description: 'Award XP points to users for sending messages',
        default:     false
    },

    LEVELING_XP_PER_MSG: {
        key:         'LEVELING_XP_PER_MSG',
        type:        'number',
        category:    'leveling',
        label:       'XP Per Message',
        description: 'Amount of XP awarded per message sent',
        default:     5,
        min:         0,
        max:         1000
    },

    LEVELING_XP_BASE: {
        key:         'LEVELING_XP_BASE',
        type:        'number',
        category:    'leveling',
        label:       'XP Base for Level Up',
        description: 'Base XP required to reach the next level',
        default:     100,
        min:         1,
        max:         100000
    },

    LEVELING_ANNOUNCE: {
        key:         'LEVELING_ANNOUNCE',
        type:        'boolean',
        category:    'leveling',
        label:       'Announce Level Up',
        description: 'Send a message when a user levels up',
        default:     true
    },

    // ── Auto Reply ────────────────────────────────────────────────────────────
    AUTO_REPLY_ENABLE: {
        key:         'AUTO_REPLY_ENABLE',
        type:        'boolean',
        category:    'autoreply',
        label:       'Auto Reply',
        description: 'Enable keyword-based automatic replies',
        default:     false
    },

    AUTO_REPLY_DEFAULT: {
        key:         'AUTO_REPLY_DEFAULT',
        type:        'json',
        category:    'autoreply',
        label:       'Auto Reply Rules',
        description: 'Array of { keyword, reply } objects',
        default:     [
            { keyword: 'hi',    reply: '👋 Hello! How can I help you?' },
            { keyword: 'hello', reply: '👋 Hello! How can I help you?' },
            { keyword: 'bye',   reply: '👋 Goodbye! Have a great day!' }
        ]
    },

    // ── Auto Bio ──────────────────────────────────────────────────────────────
    AUTO_BIO: {
        key:         'AUTO_BIO',
        type:        'boolean',
        category:    'autobio',
        label:       'Auto Bio Update',
        description: 'Automatically update WhatsApp bio at regular intervals',
        default:     false
    },

    AUTO_BIO_TEMPLATE: {
        key:         'AUTO_BIO_TEMPLATE',
        type:        'string',
        category:    'autobio',
        label:       'Bio Template',
        description: 'Bio template. Supports: {botname}, {uptime}',
        default:     '⚡ {botname} ACTIVE ({uptime}) ⚡',
        maxLength:   139   // WhatsApp bio limit
    }
};

// ── Category metadata (UI labels / icons) ────────────────────────────────────
const CATEGORIES = {
    general:    { icon: '⚙️',  label: 'General',            order: 1 },
    status:     { icon: '👁️',  label: 'Status Automation',  order: 2 },
    presence:   { icon: '💬',  label: 'Presence & Chat',    order: 3 },
    group:      { icon: '👥',  label: 'Group Management',   order: 4 },
    security:   { icon: '🛡️',  label: 'Security',           order: 5 },
    media:      { icon: '🖼️',  label: 'Media & Links',      order: 6 },
    antispam:   { icon: '🚫',  label: 'Anti-Spam',          order: 7 },
    antilink:   { icon: '🔗',  label: 'Anti-Link',          order: 8 },
    broadcast:  { icon: '📢',  label: 'Broadcast',          order: 9 },
    leveling:   { icon: '🎮',  label: 'Leveling System',    order: 10 },
    autoreply:  { icon: '💬',  label: 'Auto Reply',         order: 11 },
    autobio:    { icon: '🧬',  label: 'Auto Bio',           order: 12 }
};

// ── Exported helpers ──────────────────────────────────────────────────────────

/** All valid setting keys */
const VALID_KEYS = new Set(Object.keys(SETTINGS_SCHEMA));

/** Check if a key is a valid editable setting */
function isValidKey(key) {
    return VALID_KEYS.has(key);
}

/** Get schema entry for a key */
function getSchema(key) {
    return SETTINGS_SCHEMA[key] || null;
}

/** Get all defaults as a flat object */
function getAllDefaults() {
    const defaults = {};
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
        defaults[key] = schema.default;
    }
    return defaults;
}

/** Get defaults for a specific category */
function getCategoryDefaults(category) {
    const defaults = {};
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
        if (schema.category === category) {
            defaults[key] = schema.default;
        }
    }
    return defaults;
}

/** Get all keys in a category */
function getCategoryKeys(category) {
    return Object.keys(SETTINGS_SCHEMA).filter(k => SETTINGS_SCHEMA[k].category === category);
}

module.exports = {
    SETTINGS_SCHEMA,
    CATEGORIES,
    VALID_KEYS,
    isValidKey,
    getSchema,
    getAllDefaults,
    getCategoryDefaults,
    getCategoryKeys,
    normalizeValue,
    parseBool,
    parseNum
};
