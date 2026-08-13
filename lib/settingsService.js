/**
 * NovaX Mini — Settings Service
 *
 * Central service for all dashboard-editable bot settings.
 *
 * Resolution order (highest to lowest priority):
 *   1. Database override (set via admin dashboard)
 *   2. Environment variable (from .env)
 *   3. Schema default
 *
 * Architecture:
 *   MongoDB 'bot_settings' collection
 *        ↓
 *   In-memory runtime cache (Map)
 *        ↓
 *   Bot / Plugins read via getSetting(key) — no DB query per message
 *
 * After a dashboard update:
 *   API → setSetting(key, value) → DB persist → cache refresh → Socket.IO emit
 *
 * Startup migration:
 *   Missing settings are created from schema defaults.
 *   Existing customized values are NEVER overwritten.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { getMongoDB }        = require('./mongodb');
const logger                = require('./logger');
const {
    SETTINGS_SCHEMA,
    CATEGORIES,
    isValidKey,
    getSchema,
    getAllDefaults,
    getCategoryDefaults,
    getCategoryKeys,
    normalizeValue,
    parseBool,
    parseNum
} = require('./settingsSchema');

// ── Collection name ───────────────────────────────────────────────────────────
const COLLECTION = 'bot_settings';

// ── In-memory runtime cache ───────────────────────────────────────────────────
// Populated on startup from DB + env fallback + schema defaults.
// Updated immediately on every setSetting() call.
// Never queried per WhatsApp message — zero latency for plugins.
const runtimeCache = new Map();
let cacheReady = false;

// ── Audit log collection ──────────────────────────────────────────────────────
const AUDIT_COLLECTION = 'settings_audit';

// ── MongoDB collection helpers ────────────────────────────────────────────────
function getCol() {
    const db = getMongoDB();
    return db ? db.collection(COLLECTION) : null;
}

function getAuditCol() {
    const db = getMongoDB();
    return db ? db.collection(AUDIT_COLLECTION) : null;
}

// ── Environment variable fallback reader ──────────────────────────────────────
/**
 * Read the env-variable equivalent of a setting key.
 * Falls back to undefined if the env var is not set.
 */
function getEnvValue(key) {
    const raw = process.env[key];
    if (raw === undefined) return undefined;

    const schema = getSchema(key);
    if (!schema) return raw;

    switch (schema.type) {
        case 'boolean': return parseBool(raw);
        case 'number':  return parseNum(raw, schema.default);
        case 'array':
        case 'json':
            try { return JSON.parse(raw); } catch (_) { return schema.default; }
        default: return raw;
    }
}

// ── Startup migration ─────────────────────────────────────────────────────────
/**
 * Called once on app startup.
 *
 * For each setting in the schema:
 *   - If a DB row exists → load it into cache
 *   - If no DB row exists → create one from env fallback or schema default
 *
 * Existing user-customized values are NEVER overwritten.
 */
async function migrateSettings() {
    const col = getCol();
    if (!col) {
        logger.warn('[Settings] MongoDB not connected — running from schema defaults only.');
        _buildCacheFromDefaults();
        cacheReady = true;
        return;
    }

    logger.info('[Settings] Starting settings migration...');

    const allKeys   = Object.keys(SETTINGS_SCHEMA);
    const existing  = await col.find({ key: { $in: allKeys } }).toArray();
    const existingMap = new Map(existing.map(r => [r.key, r]));

    let created = 0;
    let loaded  = 0;

    const bulkOps = [];

    for (const key of allKeys) {
        const schema = SETTINGS_SCHEMA[key];

        if (existingMap.has(key)) {
            // ── Already in DB — load into cache (do NOT overwrite) ─────────
            const row = existingMap.get(key);
            const { ok, value } = normalizeValue(schema, row.value);
            runtimeCache.set(key, ok ? value : schema.default);
            loaded++;
        } else {
            // ── Not in DB — seed from env or schema default ────────────────
            const envVal  = getEnvValue(key);
            const seedVal = envVal !== undefined ? envVal : schema.default;
            const { ok, value } = normalizeValue(schema, seedVal);
            const finalVal = ok ? value : schema.default;

            runtimeCache.set(key, finalVal);

            bulkOps.push({
                updateOne: {
                    filter: { key },
                    update: {
                        $setOnInsert: {
                            key,
                            value:       finalVal,
                            type:        schema.type,
                            category:    schema.category,
                            label:       schema.label,
                            description: schema.description,
                            createdAt:   new Date(),
                            updatedAt:   new Date(),
                            updatedBy:   'system'
                        }
                    },
                    upsert: true
                }
            });
            created++;
        }
    }

    if (bulkOps.length > 0) {
        await col.bulkWrite(bulkOps, { ordered: false });
    }

    cacheReady = true;
    logger.success(`[Settings] Migration complete — ${loaded} loaded, ${created} seeded from defaults.`);
}

/**
 * Fallback cache population when MongoDB is unavailable.
 */
function _buildCacheFromDefaults() {
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
        const envVal = getEnvValue(key);
        runtimeCache.set(key, envVal !== undefined ? envVal : schema.default);
    }
}

// ── Core read/write ───────────────────────────────────────────────────────────

/**
 * Get a single setting value from the runtime cache.
 * This is the function plugins and the bot should use — no DB query.
 *
 * @param {string} key     Setting key
 * @param {*}      fallback Optional fallback if key is not in schema
 * @returns {*}
 */
function getSetting(key) {
    if (runtimeCache.has(key)) return runtimeCache.get(key);
    // If cache not built yet, try env then schema default
    const schema = getSchema(key);
    if (!schema) return undefined;
    const envVal = getEnvValue(key);
    return envVal !== undefined ? envVal : schema.default;
}

/**
 * Get all settings as a plain key-value object.
 * @returns {object}
 */
function getAllSettings() {
    const out = {};
    for (const key of Object.keys(SETTINGS_SCHEMA)) {
        out[key] = getSetting(key);
    }
    return out;
}

/**
 * Get all settings for a specific category.
 * @param {string} category
 * @returns {object}
 */
function getCategorySettings(category) {
    const keys = getCategoryKeys(category);
    const out  = {};
    for (const k of keys) out[k] = getSetting(k);
    return out;
}

/**
 * Set a single setting.
 * Validates value against schema, persists to DB, updates cache.
 *
 * @param {string} key      Setting key (must exist in schema)
 * @param {*}      rawValue Raw value from API
 * @param {string} [updatedBy] Who made the change (email/userId)
 * @returns {Promise<{ ok: boolean, value?: *, error?: string }>}
 */
async function setSetting(key, rawValue, updatedBy = 'admin') {
    if (!isValidKey(key)) {
        return { ok: false, error: `Unknown setting: ${key}` };
    }

    const schema = getSchema(key);
    const { ok, value, error } = normalizeValue(schema, rawValue);
    if (!ok) return { ok: false, error };

    // Update in-memory cache immediately (zero-latency for bot)
    const oldValue = runtimeCache.get(key);
    runtimeCache.set(key, value);

    // Persist to MongoDB
    const col = getCol();
    if (col) {
        try {
            await col.updateOne(
                { key },
                {
                    $set: {
                        key,
                        value,
                        type:        schema.type,
                        category:    schema.category,
                        label:       schema.label,
                        description: schema.description,
                        updatedAt:   new Date(),
                        updatedBy
                    }
                },
                { upsert: true }
            );
        } catch (err) {
            // Cache is already updated — bot will use new value.
            // Log the DB error but don't fail the operation.
            logger.error(`[Settings] DB persist failed for ${key}: ${err.message}`);
        }
    }

    // Write audit log entry (best-effort)
    _writeAudit(key, oldValue, value, updatedBy).catch(() => {});

    return { ok: true, value };
}

/**
 * Bulk update multiple settings.
 * @param {object} updates    { key: rawValue, ... }
 * @param {string} [updatedBy]
 * @returns {Promise<{ results: object, errors: object }>}
 */
async function updateSettings(updates, updatedBy = 'admin') {
    const results = {};
    const errors  = {};

    for (const [key, rawValue] of Object.entries(updates)) {
        const result = await setSetting(key, rawValue, updatedBy);
        if (result.ok) {
            results[key] = result.value;
        } else {
            errors[key] = result.error;
        }
    }

    return { results, errors };
}

/**
 * Reset a single setting to its schema default.
 * @param {string} key
 * @param {string} [updatedBy]
 */
async function resetSetting(key, updatedBy = 'admin') {
    if (!isValidKey(key)) {
        return { ok: false, error: `Unknown setting: ${key}` };
    }
    const schema = getSchema(key);
    return setSetting(key, schema.default, updatedBy);
}

/**
 * Reset all settings in a category to defaults.
 * @param {string} category
 * @param {string} [updatedBy]
 */
async function resetCategory(category, updatedBy = 'admin') {
    const keys    = getCategoryKeys(category);
    const updates = {};
    for (const k of keys) {
        updates[k] = getSchema(k).default;
    }
    return updateSettings(updates, updatedBy);
}

/**
 * Reset ALL settings to schema defaults.
 * @param {string} [updatedBy]
 */
async function resetAllSettings(updatedBy = 'admin') {
    const defaults = getAllDefaults();
    return updateSettings(defaults, updatedBy);
}

// ── Audit log ─────────────────────────────────────────────────────────────────
async function _writeAudit(key, oldValue, newValue, updatedBy) {
    const col = getAuditCol();
    if (!col) return;
    await col.insertOne({
        key,
        oldValue: _safeSerialize(oldValue),
        newValue: _safeSerialize(newValue),
        updatedBy,
        timestamp: new Date()
    });
}

function _safeSerialize(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

/**
 * Get recent audit log entries.
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
async function getAuditLog(limit = 50) {
    const col = getAuditCol();
    if (!col) return [];
    return col
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
}

// ── Schema metadata for API/UI ────────────────────────────────────────────────

/**
 * Get the full schema with current values merged in.
 * Used by the GET /api/admin/settings endpoint.
 */
function getSchemaWithValues() {
    const out = {};
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
        out[key] = {
            ...schema,
            value:   getSetting(key),
            default: schema.default
        };
    }
    return out;
}

/**
 * Get schema grouped by category with current values.
 * Used by the settings page to build the UI.
 */
function getGroupedSchema() {
    const groups = {};
    for (const [catKey, catMeta] of Object.entries(CATEGORIES)) {
        const keys = getCategoryKeys(catKey);
        if (!keys.length) continue;
        groups[catKey] = {
            ...catMeta,
            settings: keys.map(k => ({
                ...SETTINGS_SCHEMA[k],
                value:   getSetting(k),
                default: SETTINGS_SCHEMA[k].default
            }))
        };
    }
    return groups;
}

// ── Backward-compat config proxy ──────────────────────────────────────────────
/**
 * Returns a Proxy that makes config.ANTI_SPAM etc. dynamically resolve
 * the live runtime cache value, keeping all existing plugins working
 * without any code changes.
 *
 * Usage in config.js or botService.js:
 *   const { runtimeConfigProxy } = require('./lib/settingsService');
 *   // Then pass runtimeConfigProxy as `config` to commands
 *
 * The proxy first checks the settings cache, then falls back to
 * the static config object.
 */
function createRuntimeProxy(staticConfig) {
    return new Proxy(staticConfig, {
        get(target, prop) {
            // Only intercept schema-registered keys
            if (isValidKey(prop) && cacheReady) {
                return getSetting(prop);
            }
            return target[prop];
        }
    });
}

module.exports = {
    // Lifecycle
    migrateSettings,

    // Read
    getSetting,
    getAllSettings,
    getCategorySettings,
    getSchemaWithValues,
    getGroupedSchema,

    // Write
    setSetting,
    updateSettings,

    // Reset
    resetSetting,
    resetCategory,
    resetAllSettings,

    // Audit
    getAuditLog,

    // Proxy for backward compat
    createRuntimeProxy,

    // Expose for tests
    runtimeCache,
    CATEGORIES,
    SETTINGS_SCHEMA
};
