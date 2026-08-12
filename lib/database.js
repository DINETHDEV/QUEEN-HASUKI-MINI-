/**
 * NovaX Bot — lib/database.js
 * Plugin-facing database wrapper.
 * Exposes simple helpers that plugins call directly.
 * Backed by MongoDB with in-memory caching.
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { getMongoDB } = require('./mongodb');

// In-memory cache for fast lookups (avoids DB query per msg)
const configCache = new Map();

/**
 * Get collection instance safely
 */
function getCollection(name) {
    const db = getMongoDB();
    if (!db) return null;
    return db.collection(name);
}

// ── USER LANGUAGE ─────────────────────────────────────────────────────────────

/**
 * Get a user's saved language preference.
 * Accepts JID or userId.
 * @param {string} userId  WhatsApp JID or user ID
 * @returns {Promise<string|null>}
 */
async function getUserLanguage(userId) {
    if (!userId) return null;
    try {
        const col = getCollection('user_languages');
        if (!col) return null;
        const row = await col.findOne({ userId });
        return row ? row.language : null;
    } catch (err) {
        console.warn('[DB] getUserLanguage error:', err.message);
        return null;
    }
}

/**
 * Set a user's language preference.
 * @param {string} userId    WhatsApp JID or user ID
 * @param {string} language  Language code ('en' | 'si')
 */
async function setUserLanguage(userId, language) {
    if (!userId) return;
    try {
        const col = getCollection('user_languages');
        if (!col) return;
        const now = new Date();
        await col.updateOne(
            { userId },
            { 
                $set: { userId, language, updatedAt: now },
                $setOnInsert: { createdAt: now }
            },
            { upsert: true }
        );
    } catch (err) {
        console.warn('[DB] setUserLanguage error:', err.message);
    }
}

// ── BOT CONFIG & SETTINGS (settings collection) ──────────────────────────────

/**
 * Get a bot config setting.
 * @param {string} key
 * @param {*} [defaultVal=null]
 * @returns {Promise<*>}
 */
async function getBotConfig(key, defaultVal = null) {
    if (configCache.has(key)) return configCache.get(key);
    try {
        const col = getCollection('settings');
        if (!col) return defaultVal;
        const row = await col.findOne({ key });
        if (row && row.value !== undefined) {
            configCache.set(key, row.value);
            return row.value;
        }
        return defaultVal;
    } catch (err) {
        console.warn('[DB] getBotConfig error:', err.message);
        return defaultVal;
    }
}

/**
 * Set a bot config setting.
 * @param {string} key
 * @param {*} value
 */
async function setBotConfig(key, value) {
    try {
        const col = getCollection('settings');
        if (col) {
            await col.updateOne(
                { key },
                { $set: { key, value, updatedAt: new Date() } },
                { upsert: true }
            );
        }
        configCache.set(key, value);
    } catch (err) {
        console.warn('[DB] setBotConfig error:', err.message);
    }
}

/**
 * Get all bot settings as a key-value object.
 * @returns {Promise<object>}
 */
async function getAllBotConfig() {
    try {
        const col = getCollection('settings');
        if (!col) return {};
        const rows = await col.find({}).toArray();
        const result = {};
        rows.forEach(r => {
            result[r.key] = r.value;
        });
        return result;
    } catch (err) {
        console.warn('[DB] getAllBotConfig error:', err.message);
        return {};
    }
}

/**
 * Bulk update settings object
 * @param {object} settingsObj 
 */
async function updateSettings(settingsObj) {
    if (!settingsObj || typeof settingsObj !== 'object') return;
    for (const [key, value] of Object.entries(settingsObj)) {
        await setBotConfig(key, value);
    }
}

// Aliases for clear naming
const getSetting = getBotConfig;
const setSetting = setBotConfig;
const getAllSettings = getAllBotConfig;

// ── USER CONFIG (per-number config used by all-settings.js) ──────────────────

/**
 * Update config for a specific bot number
 */
async function updateUserConfig(botNumber, newConfig) {
    const key = `userConfig:${botNumber}`;
    try {
        const existing = await getBotConfig(key, {});
        const merged = { ...existing, ...newConfig };
        await setBotConfig(key, merged);
    } catch (err) {
        console.warn('[DB] updateUserConfig error:', err.message);
    }
}

/**
 * Get config for a specific bot number
 */
async function getUserConfig(botNumber) {
    const key = `userConfig:${botNumber}`;
    return getBotConfig(key, {});
}

// ── CACHE INVALIDATION ────────────────────────────────────────────────────────
function clearCache(key) {
    if (key) configCache.delete(key);
    else configCache.clear();
}

module.exports = {
    getUserLanguage,
    setUserLanguage,
    getBotConfig,
    setBotConfig,
    getAllBotConfig,
    getSetting,
    setSetting,
    getAllSettings,
    updateSettings,
    updateUserConfig,
    getUserConfig,
    clearCache
};
