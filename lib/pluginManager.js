/**
 * NovaX Bot — Plugin Manager
 * Loads, manages, and monitors all bot plugins with MongoDB persistence.
 *
 * Supports two plugin formats:
 *   1. NovaX format  — uses cmd() from NovaX_Mini.js (external plugins)
 *   2. Legacy format — exports async function directly (old NovaX Mini plugins)
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const Module = require('module');
const logger = require('./logger');
const config = require('../config');
const { getMongoDB } = require('./mongodb');

// ── Module Resolution Hook for External Plugins ──────────────────────────────
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
    if (parent && parent.filename && parent.filename.includes('plugins')) {
        if (request === '../NovaX_Mini') {
            return path.resolve(__dirname, '../NovaX_Mini.js');
        }
        if (request === '../config') {
            return path.resolve(__dirname, '../config.js');
        }
        if (request === '../package.json') {
            return path.resolve(__dirname, '../package.json');
        }
        if (request.startsWith('../lib/')) {
            const rel = request.replace('../lib/', '');
            let relFile = rel === 'language' ? 'lang.js' : rel;
            if (!relFile.endsWith('.js') && !relFile.endsWith('.json')) {
                relFile += '.js';
            }
            const targetPath = path.resolve(__dirname, '../lib', relFile);
            if (fs.existsSync(targetPath)) return targetPath;
        }
        if (!request.startsWith('.') && !path.isAbsolute(request)) {
            try {
                return originalResolve.call(this, request, parent, isMain, options);
            } catch (_) {
                return originalResolve.call(this, request, {
                    ...parent,
                    paths: [path.resolve(__dirname, '../node_modules')]
                }, isMain, options);
            }
        }
    }
    return originalResolve.call(this, request, parent, isMain, options);
};

// ── Plugin registry ───────────────────────────────────────────────────────────
const plugins    = new Map();   // name → pluginRecord
const failedList = new Map();   // name → error string

/**
 * Get MongoDB plugins collection
 */
function getPluginCollection() {
    const db = getMongoDB();
    return db ? db.collection('plugins') : null;
}

// ── Resolve all plugin directories ───────────────────────────────────────────
function getPluginDirs() {
    const dirs = [];

    // Internal plugins dir
    const internalDir = path.join(__dirname, '..', 'plugins');
    if (fs.existsSync(internalDir)) {
        dirs.push({ dir: internalDir, source: 'internal' });
    }

    // External plugin dir from config / env
    const extDir = config.EXTERNAL_PLUGIN_DIR || process.env.EXTERNAL_PLUGIN_DIR || '';
    if (extDir) {
        if (fs.existsSync(extDir)) {
            dirs.push({ dir: extDir, source: 'external' });
        } else {
            logger.warn(`[PluginManager] External plugin dir not found, skipping: ${extDir}`);
        }
    }

    return dirs;
}

// ── Collect .js files from a directory (non-recursive) ───────────────────────
function scanDir(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => f.endsWith('.js') && !f.startsWith('_'))
            .map(f => path.join(dir, f));
    } catch (err) {
        logger.warn(`[PluginManager] Cannot read dir ${dir}: ${err.message}`);
        return [];
    }
}

// ── Snapshot of global.commands before loading a plugin ─────────────────────
function captureCommandsBefore() {
    return new Set((global.commands || []).map(c => c.pattern));
}

function getNewCommands(before) {
    return (global.commands || [])
        .filter(c => !before.has(c.pattern))
        .map(c => c.pattern);
}

// ── Clear all commands registered by a plugin ────────────────────────────────
function unregisterCommands(commandList) {
    if (!commandList || !commandList.length) return;
    global.commands = (global.commands || []).filter(
        c => !commandList.includes(c.pattern)
    );
}

// ── Load a single plugin file ─────────────────────────────────────────────────
function loadPlugin(filePath, source = 'internal', storedState = null) {
    const name = path.basename(filePath, '.js');
    const isEnabled = storedState ? storedState.enabled !== false : true;

    // Snapshot commands before load
    const before = captureCommandsBefore();

    try {
        // Bust require cache for hot-reload
        if (require.cache[require.resolve(filePath)]) {
            delete require.cache[require.resolve(filePath)];
        }

        const mod = require(filePath);

        // Detect new commands added by this plugin
        const newCmds = getNewCommands(before);

        // Legacy format: module.exports is a function
        if (typeof mod === 'function' && newCmds.length === 0) {
            const legacyCmdName = name.toLowerCase();
            const exists = (global.commands || []).find(c => c.pattern === legacyCmdName);
            if (!exists) {
                if (!global.commands) global.commands = [];
                global.commands.push({
                    pattern:  legacyCmdName,
                    handler:  mod,
                    meta:     { pattern: legacyCmdName, desc: '', category: 'general' },
                    enabled:  isEnabled,
                    isAlias:  false,
                    primary:  legacyCmdName,
                    desc:     '',
                    category: 'general',
                    filename: filePath,
                });
                newCmds.push(legacyCmdName);
            }
        }

        // Apply enabled/disabled state to registered commands
        if (!isEnabled) {
            newCmds.forEach(pat => {
                global.disabledCmds.add(pat);
                const cmd = (global.commands || []).find(c => c.pattern === pat);
                if (cmd) cmd.enabled = false;
            });
        }

        const record = {
            name,
            filePath,
            source,
            commands: newCmds,
            enabled:  isEnabled,
            loaded:   true,
            error:    null,
            loadedAt: new Date(),
        };

        plugins.set(name, record);
        failedList.delete(name);
        logger.success(`[PluginManager] ✅ Loaded: ${name} [${source}] (enabled: ${isEnabled}) — cmds: ${newCmds.join(', ') || 'none'}`);
        return record;
    } catch (err) {
        const errMsg = err.message || String(err);
        failedList.set(name, errMsg);
        plugins.set(name, {
            name, filePath, source,
            commands: [], enabled: false, loaded: false,
            error: errMsg, loadedAt: new Date(),
        });
        unregisterCommands(getNewCommands(before));
        logger.error(`[PluginManager] ❌ Failed: ${name} — ${errMsg}`);
        return null;
    }
}

// ── Load ALL plugins from all dirs ────────────────────────────────────────────
async function loadAll() {
    global.commands     = [];
    global.disabledCmds = global.disabledCmds || new Set();
    plugins.clear();
    failedList.clear();

    // Fetch stored plugin states from MongoDB if available
    const dbStates = new Map();
    try {
        const col = getPluginCollection();
        if (col) {
            const stored = await col.find({}).toArray();
            stored.forEach(item => dbStates.set(item.name, item));
        }
    } catch (e) {
        logger.warn(`[PluginManager] MongoDB states fetch warning: ${e.message}`);
    }

    const dirs  = getPluginDirs();
    let total   = 0;
    let success = 0;
    let failed  = 0;

    for (const { dir, source } of dirs) {
        const files = scanDir(dir);
        logger.info(`[PluginManager] Scanning ${source} dir: ${dir} (${files.length} files)`);

        for (const filePath of files) {
            const name = path.basename(filePath, '.js');
            if (name === 'bot') continue;

            total++;
            const storedState = dbStates.get(name);
            const rec = loadPlugin(filePath, source, storedState);
            if (rec && rec.loaded) success++;
            else failed++;
        }
    }

    logger.success(`[PluginManager] Loaded ${success}/${total} plugins. Failed: ${failed}`);

    if (global.io) {
        global.io.emit('plugins_loaded', { total, success, failed });
    }

    return { total, success, failed };
}

// ── Reload a single plugin ────────────────────────────────────────────────────
function reloadPlugin(name) {
    const rec = plugins.get(name);
    if (!rec) {
        return { success: false, error: `Plugin "${name}" not found` };
    }
    unregisterCommands(rec.commands);
    const newRec = loadPlugin(rec.filePath, rec.source, { enabled: rec.enabled });
    if (global.io) global.io.emit('plugin_reloaded', { name });
    return newRec
        ? { success: true, commands: newRec.commands }
        : { success: false, error: failedList.get(name) || 'Unknown error' };
}

// ── Enable / disable a plugin ─────────────────────────────────────────────────
async function enablePlugin(name) {
    const rec = plugins.get(name);
    if (!rec) return { success: false, error: `Plugin "${name}" not found` };
    rec.enabled = true;
    rec.commands.forEach(pat => {
        global.disabledCmds.delete(pat);
        const cmd = (global.commands || []).find(c => c.pattern === pat);
        if (cmd) cmd.enabled = true;
    });

    // Persist to MongoDB
    try {
        const col = getPluginCollection();
        if (col) {
            await col.updateOne(
                { name },
                { $set: { name, enabled: true, category: rec.category || 'general', source: rec.source, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (e) {
        logger.warn(`[PluginManager] DB enable update warning: ${e.message}`);
    }

    logger.info(`[PluginManager] Enabled: ${name}`);
    if (global.io) global.io.emit('plugin_enabled', { name });
    return { success: true };
}

async function disablePlugin(name) {
    const rec = plugins.get(name);
    if (!rec) return { success: false, error: `Plugin "${name}" not found` };
    rec.enabled = false;
    rec.commands.forEach(pat => {
        global.disabledCmds.add(pat);
        const cmd = (global.commands || []).find(c => c.pattern === pat);
        if (cmd) cmd.enabled = false;
    });

    // Persist to MongoDB
    try {
        const col = getPluginCollection();
        if (col) {
            await col.updateOne(
                { name },
                { $set: { name, enabled: false, category: rec.category || 'general', source: rec.source, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (e) {
        logger.warn(`[PluginManager] DB disable update warning: ${e.message}`);
    }

    logger.info(`[PluginManager] Disabled: ${name}`);
    if (global.io) global.io.emit('plugin_disabled', { name });
    return { success: true };
}

// ── Introspection helpers ─────────────────────────────────────────────────────
function listPlugins() {
    return Array.from(plugins.values()).map(p => ({
        name:      p.name,
        source:    p.source,
        commands:  p.commands,
        enabled:   p.enabled,
        loaded:    p.loaded,
        error:     p.error,
        loadedAt:  p.loadedAt,
    }));
}

function getPlugin(name) {
    return plugins.get(name) || null;
}

function listFailed() {
    return Array.from(failedList.entries()).map(([name, error]) => ({ name, error }));
}

function stats() {
    const all     = Array.from(plugins.values());
    const cmdList = (global.commands || []);
    return {
        total:    all.length,
        loaded:   all.filter(p => p.loaded).length,
        enabled:  all.filter(p => p.enabled && p.loaded).length,
        failed:   failedList.size,
        commands: cmdList.length,
    };
}

// ── Bulk Enable / Disable ─────────────────────────────────────────────────────
async function enableAll() {
    const names = Array.from(plugins.keys());
    const results = [];
    for (const name of names) {
        const r = await enablePlugin(name);
        results.push({ name, ...r });
    }
    logger.info(`[PluginManager] Bulk enabled ${results.filter(r => r.success).length}/${names.length} plugins`);
    if (global.io) global.io.emit('plugins_bulk_enabled');
    return results;
}

async function disableAll() {
    const names = Array.from(plugins.keys());
    const results = [];
    for (const name of names) {
        const r = await disablePlugin(name);
        results.push({ name, ...r });
    }
    logger.info(`[PluginManager] Bulk disabled ${results.filter(r => r.success).length}/${names.length} plugins`);
    if (global.io) global.io.emit('plugins_bulk_disabled');
    return results;
}

module.exports = {
    loadAll,
    loadPlugin,
    reloadPlugin,
    enablePlugin,
    disablePlugin,
    enableAll,
    disableAll,
    listPlugins,
    getPlugin,
    listFailed,
    stats,
};
