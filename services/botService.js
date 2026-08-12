/**
 * Bot Service (Updated for Single-Socket Architecture, @itsliaaa/baileys & MongoDB)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const baileys = require('@itsliaaa/baileys');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    DisconnectReason
} = baileys;

const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const { Bot } = require('../database/models');
const logger = require('../lib/logger');
const config = require('../config');
const { sendInteractive, qr } = require('../lib/interactive');

const activeSockets = new Map();
const SESSION_BASE_PATH = './auth_info_baileys';

// Ensure credentials directory exists
fs.ensureDirSync(SESSION_BASE_PATH);

// Expose global baileys package for external plugins
global.baileys = baileys;

let initPromise = null;

// ── Connection notification guard ────────────────────────────────────────────
let lastNotifTime = 0;
const NOTIF_COOLDOWN_MS = 30 * 1000; // 30 seconds

/**
 * Normalise a phone number to WhatsApp JID format.
 * Accepts: +94771234567, 94771234567, 0771234567
 */
function normaliseToJid(number) {
    if (!number) return null;
    let n = String(number).replace(/[^0-9]/g, '');
    // Sri Lanka local 07x -> 947x
    if (n.startsWith('0') && n.length === 10) n = '94' + n.slice(1);
    return n + '@s.whatsapp.net';
}

/**
 * Send a connection-success notification with MENU + SETTINGS buttons.
 * Protected by cooldown to prevent duplicate sends on rapid reconnects.
 */
async function sendConnectionNotification(sock) {
    const now = Date.now();
    if (now - lastNotifTime < NOTIF_COOLDOWN_MS) return;
    lastNotifTime = now;

    const rawTarget = config.CONNECTION_NOTIFY_NUMBER || config.OWNER_NUMBER || '';
    const targetJid = normaliseToJid(rawTarget);

    if (!targetJid) {
        logger.warn('[WhatsApp] Connection notification target is not configured.');
        return;
    }

    const botName    = config.BOT_NAME    || 'NovaX Mini';
    const botVersion = config.BOT_VERSION || '3.0.0';
    const ownerName  = config.OWNER_NAME  || 'Owner';
    const footer     = config.BOT_FOOTER  || '© 2025 Zero Bug Zone';
    const prefix     = config.PREFIX      || '.';

    const bodyText =
        `╭━━━〔 *NOVA X MINI* 〕━━━╮\n` +
        `┃\n` +
        `┃ 🟢 *BOT CONNECTED*\n` +
        `┃\n` +
        `┃ ${botName} is now online.\n` +
        `┃\n` +
        `┃ ⚡ *Status :* Online\n` +
        `┃ 🤖 *Version:* v${botVersion}\n` +
        `┃ 👑 *Owner  :* ${ownerName}\n` +
        `┃ 🔤 *Prefix :* [ ${prefix} ]\n` +
        `┃\n` +
        `┃ Your WhatsApp bot is ready.\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯`;

    const buttons = [
        qr('📋 MENU',     'novax_menu'),
        qr('⚙️ SETTINGS', 'novax_settings')
    ];

    try {
        logger.info('[WhatsApp] Sending connection notification...');
        await sendInteractive(sock, targetJid, null, {
            imageUrl: config.IMAGE_PATH || null,
            title:    botName,
            body:     bodyText,
            footer,
            buttons
        });
        logger.success('[WhatsApp] Connection notification sent.');
    } catch (err) {
        logger.warn('[WhatsApp] Connection notification failed:', err.message);
    }
}

/**
 * Initialize and start the single global socket connection
 */
const initSocket = async () => {
    if (global.conn) return global.conn;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(SESSION_BASE_PATH);
            const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

            if (global.io) {
                global.io.emit('whatsapp:connecting');
            }

            const dns = require('dns');
            try {
                dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
            } catch (e) {}

            const sock = makeWASocket({
                logger: pino({ level: 'silent' }),
                printQRInTerminal: !config.USE_PAIRING_CODE,
                browser: Browsers.macOS('Safari'),
                auth: state,
                version,
                syncFullHistory: true,
                tlsAllowInvalidCertificates: true,
                family: 4
            });

            global.conn = sock;
            activeSockets.set('main', sock);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    logger.info('[WhatsApp] New QR generated.');
                    if (global.io) {
                        global.io.emit('bot_qr', { qr });
                        global.io.emit('pairing:code', { qr });
                    }
                }

                if (connection === 'connecting') {
                    if (global.io) {
                        global.io.emit('whatsapp:connecting');
                    }
                }

                if (connection === 'open') {
                    const botJid = sock.user?.id || '';
                    const botNumber = botJid.split('@')[0].split(':')[0];

                    logger.success(`✅ WhatsApp Bot connected successfully! (${botNumber})`);

                    // Update bot status in database
                    try {
                        const bot = await Bot.findOne({ phoneNumber: botNumber });
                        if (bot) {
                            await bot.update({ status: 'connected', lastSeen: new Date() });
                            if (global.io) {
                                global.io.emit('bot_status_update', { botId: bot.id, status: 'connected' });
                                global.io.emit('pairing:success', { botId: bot.id });
                            }
                        }
                    } catch (dbErr) {
                        logger.error('DB update failed on connection open:', dbErr.message);
                    }

                    if (global.io) {
                        global.io.emit('whatsapp:open');
                    }

                    // Load all internal & external plugins
                    const pluginManager = require('../lib/pluginManager');
                    await pluginManager.loadAll();

                    // Send connection notification (non-blocking, with cooldown guard)
                    setImmediate(() => sendConnectionNotification(sock));
                } else if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    logger.warn(`[WhatsApp] Connection closed. StatusCode: ${statusCode}. Reconnecting: ${shouldReconnect}`);

                    if (global.io) {
                        global.io.emit('whatsapp:close');
                    }

                    // Update bot status in DB
                    try {
                        const botJid = sock.user?.id || '';
                        const botNumber = botJid.split('@')[0].split(':')[0];
                        const bot = await Bot.findOne({ phoneNumber: botNumber });
                        if (bot) {
                            await bot.update({ status: shouldReconnect ? 'connecting' : 'disconnected' });
                            if (global.io) {
                                global.io.emit('bot_status_update', { botId: bot.id, status: shouldReconnect ? 'connecting' : 'disconnected' });
                            }
                        }
                    } catch (dbErr) {
                        logger.error('DB update failed on connection close:', dbErr.message);
                    }

                    global.conn = null;
                    activeSockets.delete('main');
                    initPromise = null;

                    if (shouldReconnect) {
                        setTimeout(initSocket, 5000);
                    } else {
                        logger.error('[WhatsApp] Logged out from WhatsApp, delete credentials folder to relogin.');
                    }
                }
            });

            sock.ev.on('creds.update', saveCreds);

            // Message handling registry
            setupMessageHandlers(sock);

            return sock;
        } catch (error) {
            initPromise = null;
            logger.error('Socket initialization failed:', error.message);
            throw error;
        }
    })();

    return initPromise;
};

// Start a pairing session for a phone number
const createBotSession = async (phoneNumber) => {
    try {
        const sock = await initSocket();
        
        // Wait until the socket is ready for pairing
        await sock.waitForSocketOpen();
        
        // Request the pairing code
        const code = await sock.requestPairingCode(phoneNumber);
        return code;
    } catch (error) {
        logger.error('Failed to create bot pairing session:', error.message);
        throw error;
    }
};

// Setup message handlers
const setupMessageHandlers = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || !messages.length) return;
        const mek = messages[0];
        if (!mek?.message || mek.key.remoteJid === 'status@broadcast') return;

        try {
            // Un-ephemeral message if needed
            const rawMsg = getContentType(mek.message) === 'ephemeralMessage'
                ? mek.message.ephemeralMessage.message
                : mek.message;

            const type = getContentType(rawMsg);
            const from = mek.key.remoteJid;
            const isGroup = from.endsWith('@g.us');

            const body = type === 'conversation'
                ? rawMsg.conversation
                : rawMsg[type]?.text || rawMsg[type]?.caption || '';

            const prefix = config.PREFIX || '.';
            if (!body.startsWith(prefix)) return;

            const commandName = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(' ');
            const text = q;

            const sender = mek.key.fromMe ? (sock.user?.id || '') : (mek.key.participant || from);
            const senderNumber = sender.split('@')[0].split(':')[0];
            const isOwner = (config.OWNER_NUMBER || '94789737967').split(',').map(n => n.trim()).includes(senderNumber);

            const reply = textMsg => sock.sendMessage(from, { text: textMsg }, { quoted: mek });
            const quoted = rawMsg[type]?.contextInfo?.quotedMessage || null;
            const botNumber = sock.user ? sock.user.id.split('@')[0].split(':')[0] : '';

            // Update stats
            try {
                const bot = await Bot.findOne({ phoneNumber: botNumber });
                if (bot) {
                    const stats = bot.statistics || {};
                    stats.messagesReceived = (stats.messagesReceived || 0) + 1;
                    await bot.update({ statistics: stats });
                }
            } catch (_) {}

            // Group metadata
            let groupMetadata = null;
            let groupAdmins = [];
            let isAdmins = false;
            let isBotAdmins = false;

            if (isGroup) {
                try {
                    groupMetadata = await sock.groupMetadata(from).catch(() => null);
                    if (groupMetadata) {
                        groupAdmins = groupMetadata.participants
                            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                            .map(p => p.id);
                        isAdmins = groupAdmins.includes(sender);
                        const botJid = sock.user ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
                        isBotAdmins = groupAdmins.some(a => a.startsWith(botJid.split('@')[0]));
                    }
                } catch (_) {}
            }

            const cmd = (global.commands || []).find(c => c.pattern === commandName && c.enabled !== false);
            if (cmd) {
                // Owner / Group check
                if (cmd.owner && !isOwner) return reply('🚫 This command is only for the Owner!');
                if (cmd.group && !isGroup) return reply('❌ This command can only be used in groups.');
                if (cmd.admin && !isAdmins) return reply('❌ Only group admins can use this command.');

                const contextObj = {
                    from,
                    sender,
                    isOwner,
                    isGroup,
                    groupMetadata,
                    groupAdmins,
                    isAdmins,
                    isBotAdmins,
                    reply,
                    body,
                    args,
                    q,
                    text,
                    quoted,
                    botNumber,
                    config
                };

                try {
                    if (typeof cmd.handler === 'function') {
                        await cmd.handler(sock, mek, mek, contextObj);
                    } else if (typeof cmd.function === 'function') {
                        await cmd.function(sock, contextObj);
                    }

                    // Update executed stats
                    try {
                        const bot = await Bot.findOne({ phoneNumber: botNumber });
                        if (bot) {
                            const stats = bot.statistics || {};
                            stats.commandsExecuted = (stats.commandsExecuted || 0) + 1;
                            await bot.update({ statistics: stats });
                        }
                    } catch (_) {}
                } catch (cmdErr) {
                    logger.error(`[PLUGIN ERROR: ${commandName}]`, cmdErr);
                    await reply(`❌ Error executing command: ${cmdErr.message}`);
                }
            }
        } catch (err) {
            logger.error('Message handler error:', err);
        }
    });

    // Button / NativeFlow response handling
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages?.length) return;
        const msg = messages[0];
        if (!msg?.message) return;

        const type = getContentType(msg.message);
        const from = msg.key.remoteJid;

        // Classic ButtonsResponseMessage
        let buttonId = '';
        if (type === 'buttonsResponseMessage') {
            buttonId = msg.message.buttonsResponseMessage?.selectedButtonId || '';
        }

        // NativeFlow / Interactive response (interactiveResponseMessage)
        if (type === 'interactiveResponseMessage') {
            try {
                const native = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage;
                const params = JSON.parse(native?.paramsJson || '{}');
                buttonId = params.id || '';
            } catch (_) {}
        }

        if (!buttonId) return;

        const prefix = config.PREFIX || '.';

        // ── NovaX Mini built-in button IDs ───────────────────────────────────
        if (buttonId === 'novax_menu') {
            // Trigger .menu command
            const menuCmd = (global.commands || []).find(c => c.pattern === 'menu' || c.pattern === 'allmenu');
            if (menuCmd && typeof menuCmd.handler === 'function') {
                const fakeCtx = {
                    from,
                    sender: msg.key.participant || from,
                    isOwner: false,
                    isGroup: from.endsWith('@g.us'),
                    reply: text => sock.sendMessage(from, { text }, { quoted: msg }),
                    body: `${prefix}menu`,
                    args: [],
                    q: '',
                    text: '',
                    pushname: '',
                    quoted: null,
                    botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '',
                    config
                };
                try { await menuCmd.handler(sock, msg, msg, fakeCtx); } catch (e) {
                    logger.error('[Button:novax_menu] Error:', e.message);
                }
            } else {
                await sock.sendMessage(from, { text: `Use *${prefix}menu* to see all commands.` }, { quoted: msg });
            }
            return;
        }

        if (buttonId === 'novax_settings') {
            const settingsCmd = (global.commands || []).find(c => ['settings', 'setting', 'mode', 'config'].includes(c.pattern));
            if (settingsCmd && typeof settingsCmd.handler === 'function') {
                const fakeCtx = {
                    from,
                    sender: msg.key.participant || from,
                    isOwner: true,
                    isGroup: from.endsWith('@g.us'),
                    reply: text => sock.sendMessage(from, { text }, { quoted: msg }),
                    body: `${prefix}settings`,
                    args: [],
                    q: '',
                    text: '',
                    pushname: '',
                    quoted: null,
                    botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '',
                    config
                };
                try { await settingsCmd.handler(sock, msg, msg, fakeCtx); } catch (e) {
                    logger.error('[Button:novax_settings] Error:', e.message);
                }
            } else {
                await sock.sendMessage(from, {
                    text:
                        `╭━━━〔 *⚙️ NovaX Mini Settings* 〕━━━┈\n` +
                        `┃ Use *${prefix}mode* to toggle bot mode.\n` +
                        `┃ Visit the web panel for full settings:\n` +
                        `┃ http://localhost:${config.PORT || 5000}\n` +
                        `╰━━━━━━━━━━━━━━━┈`
                }, { quoted: msg });
            }
            return;
        }

        // Legacy contact_owner button
        if (buttonId === 'contact_owner') {
            const ownerNum = config.OWNER_NUMBER || '94789737967';
            await sock.sendMessage(from, {
                text: `📞 Contact the owner: wa.me/${ownerNum}`
            }, { quoted: msg });
        }
    });
};

// Bot utility functions
const getBotStatus = (botId) => {
    const socket = global.conn;
    if (!socket || !socket.user) return { status: 'disconnected', online: false };
    return { status: 'connected', online: true, user: socket.user, lastSeen: new Date() };
};

const updateBotSettings = (botId, settings) => {
    const socket = global.conn;
    if (socket) {
        logger.info(`Updated settings for bot ${botId}:`, settings);
        if (global.io) global.io.emit('bot_settings_update', { botId, settings });
    }
};

const disconnectBot = async (botId) => {
    const socket = global.conn;
    if (socket) {
        try {
            socket.ws.close();
        } catch (_) {}
        global.conn = null;
        activeSockets.delete('main');
        initPromise = null;
        await Bot.update({ status: 'disconnected' }, { where: { id: botId } });
    }
};

module.exports = {
    initSocket,
    createBotSession,
    getBotStatus,
    updateBotSettings,
    disconnectBot
};
