/**
 * NovaX Mini — Centralized Safe Send Helper
 * Wraps all outbound WhatsApp messages with:
 *   - JID validation
 *   - Socket validity check
 *   - Full error logging
 *   - Never throws — always resolves (returns null on failure)
 *
 * Supports: text, image, audio, document, video, reaction, contact, sticker
 *
 * Usage:
 *   const { safeSendMessage, safeSendText, safeSendAudio } = require('../lib/safeSend');
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('./logger');

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidJid(jid) {
    return typeof jid === 'string' && jid.length > 5 &&
        (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us') ||
         jid.endsWith('@broadcast') || jid.endsWith('@newsletter'));
}

function isValidConn(conn) {
    return conn &&
        typeof conn.sendMessage === 'function' &&
        typeof conn.relayMessage === 'function';
}

// ── Core safe send ────────────────────────────────────────────────────────────

/**
 * Safely send any WhatsApp message.
 *
 * @param {object}  conn      Baileys WASocket (global.conn)
 * @param {string}  jid       Target chat JID
 * @param {object}  content   Message content object
 * @param {object}  [opts]    Options: { quoted, ephemeralExpiration, ... }
 * @returns {Promise<object|null>}  Sent message object or null on failure
 */
async function safeSendMessage(conn, jid, content, opts = {}) {
    if (!isValidConn(conn)) {
        logger.warn('[SafeSend] No valid socket provided. Message dropped.');
        return null;
    }

    if (!isValidJid(jid)) {
        logger.warn(`[SafeSend] Invalid JID: "${jid}". Message dropped.`);
        return null;
    }

    if (!content || typeof content !== 'object') {
        logger.warn('[SafeSend] Empty or invalid content. Message dropped.');
        return null;
    }

    try {
        return await conn.sendMessage(jid, content, opts);
    } catch (err) {
        logger.error(`[SafeSend] sendMessage failed to ${jid}: ${err.message}`);
        return null;
    }
}

// ── Type-specific helpers ─────────────────────────────────────────────────────

/**
 * Send a plain text message.
 * @param {object}  conn
 * @param {string}  jid
 * @param {string}  text
 * @param {object}  [mek]  Quoted message
 */
async function safeSendText(conn, jid, text, mek = null) {
    const content = { text: String(text || '') };
    const opts = mek ? { quoted: mek } : {};
    return safeSendMessage(conn, jid, content, opts);
}

/**
 * Send an image.
 * @param {object}       conn
 * @param {string}       jid
 * @param {Buffer|{url}} imageSource  Buffer or { url: '...' }
 * @param {string}       [caption]
 * @param {object}       [mek]
 */
async function safeSendImage(conn, jid, imageSource, caption = '', mek = null) {
    const content = {
        image: imageSource,
        caption: caption || ''
    };
    const opts = mek ? { quoted: mek } : {};
    return safeSendMessage(conn, jid, content, opts);
}

/**
 * Send audio (playable, non-PTT).
 * Supports Buffer (file read) or { url } (direct stream).
 *
 * @param {object}        conn
 * @param {string}        jid
 * @param {Buffer|{url}}  audioSource  Buffer or { url: '...' }
 * @param {string}        [mimeType]   Default: 'audio/mpeg'
 * @param {object}        [mek]
 */
async function safeSendAudio(conn, jid, audioSource, mimeType = 'audio/mpeg', mek = null) {
    const content = {
        audio: audioSource,
        mimetype: mimeType,
        ptt: false
    };
    const opts = mek ? { quoted: mek } : {};
    return safeSendMessage(conn, jid, content, opts);
}

/**
 * Send a document.
 * @param {object}        conn
 * @param {string}        jid
 * @param {Buffer|{url}}  docSource
 * @param {string}        [mimeType]
 * @param {string}        [fileName]
 * @param {string}        [caption]
 * @param {object}        [mek]
 */
async function safeSendDocument(conn, jid, docSource, mimeType = 'audio/mpeg', fileName = 'file', caption = '', mek = null) {
    const content = {
        document: docSource,
        mimetype: mimeType,
        fileName,
        caption: caption || ''
    };
    const opts = mek ? { quoted: mek } : {};
    return safeSendMessage(conn, jid, content, opts);
}

/**
 * Send a video.
 * @param {object}        conn
 * @param {string}        jid
 * @param {Buffer|{url}}  videoSource
 * @param {string}        [caption]
 * @param {string}        [mimeType]
 * @param {object}        [mek]
 */
async function safeSendVideo(conn, jid, videoSource, caption = '', mimeType = 'video/mp4', mek = null) {
    const content = {
        video: videoSource,
        caption: caption || '',
        mimetype: mimeType
    };
    const opts = mek ? { quoted: mek } : {};
    return safeSendMessage(conn, jid, content, opts);
}

/**
 * Send an emoji reaction.
 * @param {object} conn
 * @param {object} mek   The message to react to
 * @param {string} emoji Reaction emoji
 */
async function safeSendReaction(conn, jid, mek, emoji) {
    if (!isValidConn(conn) || !mek?.key) return null;
    try {
        return await conn.sendMessage(jid, { react: { text: emoji, key: mek.key } });
    } catch (e) {
        logger.warn('[SafeSend] Reaction failed:', e.message);
        return null;
    }
}

/**
 * Send a formatted error message to the user (safe, never throws).
 * Does NOT expose paths, stack traces, or tokens.
 * @param {object} conn
 * @param {string} jid
 * @param {object} mek
 * @param {string} pluginName
 * @param {string} shortError
 */
async function safeSendPluginError(conn, jid, mek, pluginName, shortError) {
    const text =
        `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n` +
        `┃ ❌ Command failed.\n` +
        `┃\n` +
        `┃ 🔌 *Plugin:* ${pluginName || 'unknown'}\n` +
        `┃ 📋 *Error:* ${shortError || 'Unknown error'}\n` +
        `┃\n` +
        `┃ Please try again.\n` +
        `╰━━━━━━━━━━━━━━━┈`;
    return safeSendText(conn, jid, text, mek);
}

module.exports = {
    safeSendMessage,
    safeSendText,
    safeSendImage,
    safeSendAudio,
    safeSendDocument,
    safeSendVideo,
    safeSendReaction,
    safeSendPluginError,
    isValidConn,
    isValidJid
};
