/**
 * NovaX Mini — Menu Plugin (Fixed)
 *
 * BUG FIXED:
 *   Was using `module.exports = async function(socket, msg, bot)` format.
 *   pluginManager.js registered this as cmd.function(socket, contextObj) so
 *   msg was never the actual message — it was the contextObj, and
 *   msg.key.remoteJid was always undefined.
 *
 *   Fixed by converting to standard cmd() format.
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { cmd }            = require('../NovaX_Mini');
const { sendInteractive, qr, url } = require('../lib/interactive');
const config             = require('../config');

cmd({
    pattern:  'menu',
    alias:    ['help', 'start', 'cmds'],
    desc:     'Show the main command menu',
    category: 'main',
    react:    '📋',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, args, body }) => {
    try {
        const prefix  = config.PREFIX  || '.';
        
        // If arguments are provided (e.g. .menu download), forward directly to allmenu handler
        if (args && args.length > 0) {
            const allMenuCmd = (global.commands || []).find(c => c.pattern === 'allmenu');
            if (allMenuCmd && typeof allMenuCmd.handler === 'function') {
                console.log(`[MENU] Forwarding category menu request to allmenu.js: ${args.join(' ')}`);
                return await allMenuCmd.handler(conn, mek, m, { from, sender, reply, args, body, command: 'allmenu' });
            }
        }
        
        const botName = config.BOT_NAME || 'NovaX Mini';
        const version = config.BOT_VERSION || '3.0.0';
        const totalCmds = (global.commands || []).filter(c => c.enabled !== false && !c.meta?.dontAddCommandList).length;

        const menuText =
            `⚡ *${botName}* ⚡\n` +
            `Advanced WhatsApp Bot\n\n` +
            `🤖 *BOT INFO*\n` +
            `• Name: ${botName}\n` +
            `• Version: v${version}\n` +
            `• Prefix: ${prefix}\n` +
            `• Commands: ${totalCmds}\n` +
            `• Status: Online ✅\n\n` +
            `📋 Use *${prefix}allmenu* to see all commands by category.`;

        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            title:    '👑 NovaX Mini Menu',
            body:     menuText,
            footer:   config.BOT_FOOTER || '© 2025 Zero Bug Zone',
            buttons: [
                qr('⚡ Alive',    `${prefix}alive`),
                qr('🏓 Ping',     `${prefix}ping`),
                qr('📋 All Menu', `${prefix}allmenu`),
            ]
        });

    } catch (error) {
        console.error('[menu] Error:', error);
        await conn.sendMessage(from, {
            text: `❌ Menu error: ${error.message}`
        }, { quoted: mek }).catch(() => {});
    }
});
