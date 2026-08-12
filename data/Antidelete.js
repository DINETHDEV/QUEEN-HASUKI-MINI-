/**
 * NovaX Mini — Anti-Delete Store
 * MongoDB-backed per-chat anti-delete toggle.
 * Exports: setAntideleteStatus(jid, status), getAntideleteStatus(jid)
 */

'use strict';

const { getMongoDB } = require('../lib/mongodb');
const logger = require('../lib/logger');

// In-memory cache to avoid hitting DB on every message
const cache = new Map();

function getCollection() {
    const db = getMongoDB();
    return db ? db.collection('antidelete') : null;
}

/**
 * Set anti-delete mode for a JID.
 * @param {string} jid    WhatsApp JID (group or private)
 * @param {boolean} status  true = enabled, false = disabled
 */
async function setAntideleteStatus(jid, status) {
    cache.set(jid, !!status);
    try {
        const col = getCollection();
        if (col) {
            await col.updateOne(
                { jid },
                { $set: { jid, enabled: !!status, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (err) {
        logger.warn('[Antidelete] DB write failed:', err.message);
    }
}

/**
 * Get anti-delete status for a JID.
 * @param {string} jid
 * @returns {Promise<boolean>}
 */
async function getAntideleteStatus(jid) {
    if (cache.has(jid)) return cache.get(jid);
    try {
        const col = getCollection();
        if (col) {
            const doc = await col.findOne({ jid });
            const val = doc ? !!doc.enabled : false;
            cache.set(jid, val);
            return val;
        }
    } catch (err) {
        logger.warn('[Antidelete] DB read failed:', err.message);
    }
    return false;
}

module.exports = { setAntideleteStatus, getAntideleteStatus };
