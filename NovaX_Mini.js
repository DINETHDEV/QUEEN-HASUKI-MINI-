/**
 * NovaX_Mini.js — Command Registration Shim
 *
 * This file bridges the gap between the external NovaX plugin format
 * and the NovaX Mini bot framework.
 *
 * External plugins do:
 *   const { cmd, commands } = require('../NovaX_Mini');
 *   cmd({ pattern, alias, desc, category, ... }, handler);
 *
 * This shim registers those commands into global.commands so the
 * bot's message handler can find and execute them.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

// Ensure global commands store exists
if (!global.commands)     global.commands     = [];
if (!global.disabledCmds) global.disabledCmds = new Set();

/**
 * Register one or more commands.
 *
 * @param {object}   meta              Command metadata
 * @param {string}   meta.pattern      Primary command name (without prefix)
 * @param {string[]} [meta.alias]      Aliases
 * @param {string}   [meta.desc]       Description
 * @param {string}   [meta.category]   Category
 * @param {string}   [meta.react]      Reaction emoji
 * @param {string}   [meta.use]        Usage example
 * @param {string}   [meta.filename]   Source filename
 * @param {boolean}  [meta.owner]      Owner-only flag
 * @param {boolean}  [meta.group]      Group-only flag
 * @param {boolean}  [meta.admin]      Admin-only flag
 * @param {Function} handler           Async handler: (conn, mek, m, ctx) => {}
 */
function cmd(meta, handler) {
    if (typeof meta !== 'object' || !meta.pattern) {
        console.warn('[NovaX_Mini] cmd() called without a valid pattern — skipping.');
        return;
    }
    if (typeof handler !== 'function') {
        console.warn(`[NovaX_Mini] cmd(${meta.pattern}) handler is not a function — skipping.`);
        return;
    }

    const patterns = [meta.pattern, ...(meta.alias || [])].map(p =>
        String(p).toLowerCase().trim()
    );

    for (const pat of patterns) {
        // Skip if already registered (dedup)
        const existing = global.commands.find(c => c.pattern === pat);
        if (existing) {
            // Overwrite with new definition (latest plugin wins — allows reload)
            existing.handler    = handler;
            existing.meta       = meta;
            existing.enabled    = !global.disabledCmds.has(pat);
            existing.isAlias    = pat !== meta.pattern;
            continue;
        }

        global.commands.push({
            pattern:   pat,
            handler,
            meta,
            enabled:   !global.disabledCmds.has(pat),
            isAlias:   pat !== meta.pattern,
            primary:   meta.pattern.toLowerCase(),
            // Exposed properties for web panel
            desc:      meta.desc      || '',
            category:  meta.category  || 'general',
            author:    meta.author    || '',
            react:     meta.react     || '',
            owner:     meta.owner     || false,
            group:     meta.group     || false,
            admin:     meta.admin     || false,
            filename:  meta.filename  || '',
        });
    }
}

module.exports = { cmd, commands: global.commands };
