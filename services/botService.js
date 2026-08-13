/**
 * Bot Service (Updated for Single-Socket Architecture, @itsliaaa/baileys & MongoDB)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 *
 * PAIRING FIX CHANGELOG:
 *  - Removed non-existent sock.waitForSocketOpen() — was causing hangs/crashes
 *  - Added waitForWsOpen() — polls sock.ws.readyState with 15s timeout
 *  - Added per-phone pairingLocks Map (exported for routes)
 *  - Added pairSuccessNotified flag — pair notification fires exactly once
 *  - Added sendPairSuccessNotification() — sends to bot's own JID
 *  - Made connection === 'open' handler non-blocking
 *  - Moved pluginManager.loadAll() to setImmediate
 *  - Moved DB updates to setImmediate (fire-and-forget after status broadcast)
 *  - Added detailed [PAIR] logs with ms timing
 *  - Exponential backoff on reconnect (5s → 10s → 20s → 40s → 60s max)
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

// ── Per-phone pairing locks (exported for routes) ─────────────────────────────
const pairingLocks = new Map(); // phoneNumber → true

// ── Per-session WhatsApp connection state ─────────────────────────────────────
// Tracks the WhatsApp-level state separately from the raw WebSocket readyState.
// WebSocket OPEN does NOT mean WhatsApp authenticated — these are different states.
//
// Valid states:
//   'created'       – socket object created, WS not yet open
//   'connecting'    – WS open, Noise protocol handshake in progress
//   'qr_ready'      – QR challenge received, socket can issue pairing code
//   'pairing'       – requestPairingCode() has been called
//   'authenticated' – connection === 'open' (WhatsApp auth complete)
//   'closed'        – connection closed, may reconnect
//   'logged_out'    – DisconnectReason.loggedOut — do NOT reconnect
let sessionState = 'created';

// ── In-memory stats buffer (batch DB writes instead of per-message) ──────────
let statsBuffer = { messagesReceived: 0, commandsExecuted: 0 };
let statsFlushTimer = null;
const STATS_FLUSH_INTERVAL = 15000; // flush every 15 seconds instead of per message

function scheduleStatsFlush(botNumber) {
    if (statsFlushTimer) return;
    statsFlushTimer = setTimeout(async () => {
        statsFlushTimer = null;
        if (!statsBuffer.messagesReceived && !statsBuffer.commandsExecuted) return;
        const snap = { ...statsBuffer };
        statsBuffer = { messagesReceived: 0, commandsExecuted: 0 };
        try {
            const bot = await Bot.findOne({ phoneNumber: botNumber });
            if (bot) {
                const stats = bot.statistics || {};
                stats.messagesReceived = (stats.messagesReceived || 0) + snap.messagesReceived;
                stats.commandsExecuted = (stats.commandsExecuted || 0) + snap.commandsExecuted;
                await bot.update({ statistics: stats });
            }
        } catch (_) {}
    }, STATS_FLUSH_INTERVAL);
}

// ── Group metadata cache (avoid repeated network calls) ──────────────────────
const groupMetaCache = new Map(); // jid → { meta, ts }
const GROUP_META_TTL = 5 * 60 * 1000; // 5 minutes

// Ensure credentials directory exists
fs.ensureDirSync(SESSION_BASE_PATH);

// Expose global baileys package for external plugins
global.baileys = baileys;

let initPromise = null;

// ── Pair-success notification guard ──────────────────────────────────────────
// Set to true after the FIRST successful pair. Reset when credentials are cleared.
let pairSuccessNotified = false;

// ── Connection notification guard ────────────────────────────────────────────
let lastNotifTime = 0;
const NOTIF_COOLDOWN_MS = 30 * 1000; // 30 seconds

// ── Reconnect backoff state ───────────────────────────────────────────────────
let reconnectAttempts = 0;
const MAX_BACKOFF_MS  = 60 * 1000; // 60 seconds max
const BASE_BACKOFF_MS = 5  * 1000; // 5 seconds base

function getBackoffMs() {
    const ms = Math.min(BASE_BACKOFF_MS * Math.pow(2, reconnectAttempts), MAX_BACKOFF_MS);
    reconnectAttempts++;
    return ms;
}

/**
 * Normalise a phone number to WhatsApp JID format.
 * Accepts: +94771234567, 94771234567, 0771234567
 */
function normaliseToJid(number) {
    if (!number) return null;
    let n = String(number).replace(/[^0-9]/g, '');
    // Sri Lanka local 07x → 947x
    if (n.startsWith('0') && n.length === 10) n = '94' + n.slice(1);
    return n + '@s.whatsapp.net';
}

/**
 * Send a PAIR SUCCESS notification to the bot's own WhatsApp JID.
 * Called once per fresh pair — NOT on reconnects.
 * Failures are caught and logged — never bubble up to crash the bot.
 */
async function sendPairSuccessNotification(sock) {
    console.log('[PAIR] Sending success notification...');

    const rawJid   = sock.user?.id || '';
    // Normalize: "94xxxxxxxxx:xx@s.whatsapp.net" → "94xxxxxxxxx@s.whatsapp.net"
    const cleanNum = rawJid.split('@')[0].split(':')[0];
    const targetJid = cleanNum ? cleanNum + '@s.whatsapp.net' : null;

    if (!targetJid) {
        logger.warn('[PAIR] Cannot send success notification — no user JID available.');
        return;
    }

    const botName    = config.BOT_NAME    || 'NovaX Mini';
    const botVersion = config.BOT_VERSION || '3.0.0';
    const prefix     = config.PREFIX      || '.';

    const successMessage =
        `╭───〔 *NOVA X MINI* 〕───╮\n` +
        `│\n` +
        `│ ✅ *Pairing Successful!*\n` +
        `│\n` +
        `│ 🤖 *Bot:* ${botName}\n` +
        `│ 🔖 *Version:* v${botVersion}\n` +
        `│ 📱 *Status:* Connected\n` +
        `│ ⚡ *Connection:* Active\n` +
        `│\n` +
        `│ Your WhatsApp account has\n` +
        `│ been successfully connected\n` +
        `│ to ${botName}.\n` +
        `│\n` +
        `│ 🔤 *Prefix:* [ ${prefix} ]\n` +
        `│ 🚀 *Bot is ready to use!*\n` +
        `│\n` +
        `╰──────────────────────╯`;

    await sock.sendMessage(targetJid, { text: successMessage });
    console.log('[PAIR] Success notification sent to:', targetJid);
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
 * Wait for the Baileys socket to be ready to issue a pairing code.
 *
 * CRITICAL FIX — two bugs in the previous version:
 *
 * Bug 1 — Stale QR fast-path:
 *   The old code did `if (global.qrCode) { return resolve(); }` immediately.
 *   This caused the function to resolve instantly whenever a QR had been
 *   generated in a previous session, even if the current socket is brand-new
 *   and has not yet received a QR/connecting event.
 *   requestPairingCode() was then called on a socket that was NOT in a state
 *   ready for it → WhatsApp closed the connection with 408 → reconnect → 401.
 *
 * Bug 2 — Resolved too early on 'connecting':
 *   'connecting' means the TCP/TLS handshake completed but the WhatsApp noise
 *   protocol challenge hasn't been answered yet.  requestPairingCode() must
 *   NOT be called at this point — it must wait for the QR event (which means
 *   the noise handshake is done and the server is ready for login).
 *
 * Correct strategy:
 *   1. If sessionState is already 'qr_ready' or 'authenticated', resolve immediately.
 *   2. Otherwise wait for a 'qr' event from connection.update (noise handshake done).
 *   3. If 'open' fires first (already-authenticated restart), also resolve.
 *   4. If 'close' fires, reject.
 *   5. Hard timeout after timeoutMs.
 *
 * Do NOT resolve on 'connecting' alone — the socket is not ready then.
 */
function waitForWsReady(sock, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const started = Date.now();

        // ── Fast path: socket already in a usable state ──────────────────────
        if (sessionState === 'qr_ready' || sessionState === 'authenticated') {
            console.log(`[PAIR] WS already ready — sessionState: ${sessionState}`);
            return resolve();
        }

        let resolved = false;
        function done(err) {
            if (resolved) return;
            resolved = true;
            clearInterval(poll);
            clearTimeout(hardTimeout);
            sock.ev.off('connection.update', onUpdate);
            if (err) reject(err); else resolve();
        }

        // ── Primary: wait for QR event (noise handshake complete) ────────────
        // 'qr' means the server sent a QR challenge — socket is now ready for
        // requestPairingCode().
        // 'open' means fully authenticated — also fine (already-auth'd restart).
        function onUpdate({ connection, qr: qrData }) {
            if (qrData) {
                // QR received = socket is at the login challenge stage
                // This is exactly when requestPairingCode() can be called
                console.log('[PAIR] WS ready — QR event received (noise handshake complete).');
                sessionState = 'qr_ready';
                done();
            } else if (connection === 'open') {
                // Already authenticated — pairing code not needed but socket is ready
                console.log('[PAIR] WS ready — connection already open (authenticated).');
                sessionState = 'authenticated';
                done();
            } else if (connection === 'close') {
                done(new Error('WS_CLOSED: Socket closed before becoming ready'));
            }
            // NOTE: do NOT resolve on connection === 'connecting' alone —
            // the socket is not yet ready for requestPairingCode() at that stage
        }
        sock.ev.on('connection.update', onUpdate);

        // ── Fallback polling (in case event was already emitted before we subscribed) ──
        const poll = setInterval(() => {
            if (sessionState === 'qr_ready' || sessionState === 'authenticated') {
                console.log(`[PAIR] WS ready — poll detected sessionState: ${sessionState}`);
                done();
            }
        }, 300);

        // ── Hard timeout ─────────────────────────────────────────────────────
        const hardTimeout = setTimeout(() => {
            done(new Error(`WS_NOT_READY: Socket did not reach qr_ready state within ${timeoutMs}ms`));
        }, timeoutMs);
    });
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
                syncFullHistory: false,       // ⚡ false = faster startup, less memory
                markOnlineOnConnect: false,    // ⚡ don't spam presence updates
                generateHighQualityLinkPreview: false, // ⚡ skip link previews
                tlsAllowInvalidCertificates: true,
                family: 4
            });

            global.conn = sock;
            activeSockets.set('main', sock);

            // Reset session state for new socket
            sessionState = 'created';

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr: qrData } = update;

                if (qrData) {
                    logger.info('[WhatsApp] New QR generated.');
                    // Update session state: QR received = ready for pairing code
                    sessionState = 'qr_ready';
                    global.qrCode = qrData;
                    if (global.io) {
                        global.io.emit('bot_qr', { qr: qrData });
                        global.io.emit('pairing:code', { qr: qrData });
                    }
                }

                if (connection === 'connecting') {
                    sessionState = 'connecting';
                    console.log('[PAIR] Connection state: connecting');
                    if (global.io) {
                        global.io.emit('whatsapp:connecting');
                    }
                }

                if (connection === 'open') {
                    const connectionStart = Date.now();
                    const botJid    = sock.user?.id || '';
                    const botNumber = botJid.split('@')[0].split(':')[0];

                    // Update session state: WhatsApp authentication complete
                    sessionState = 'authenticated';
                    // Clear stale QR — it's no longer valid now that we're authenticated
                    global.qrCode = null;

                    console.log(`[PAIR] Connection opened — bot JID: ${botJid}`);
                    logger.success(`✅ WhatsApp Bot connected successfully! (${botNumber})`);

                    // ── 1. IMMEDIATELY broadcast connected status ─────────────
                    if (global.io) {
                        global.io.emit('whatsapp:open');
                        global.io.emit('bot_status_update', { status: 'connected', botNumber });
                        global.io.emit('pairing:success', { botNumber });
                    }
                    console.log('[PAIR] Session marked connected');

                    // Reset reconnect counter on successful open
                    reconnectAttempts = 0;

                    // ── 2. Pair success notification — exactly once per real pair ──
                    if (!pairSuccessNotified) {
                        pairSuccessNotified = true;
                        console.log('[PAIR] Sending success notification (first pair only)...');
                        sendPairSuccessNotification(sock)
                            .then(() => console.log('[PAIR] Success notification sent'))
                            .catch(err => console.error('[PAIR-NOTIFY]', err.message));
                    }

                    // ── 3. Load plugins async (non-blocking) ─────────────────
                    setImmediate(async () => {
                        try {
                            const pluginManager = require('../lib/pluginManager');
                            await pluginManager.loadAll();
                        } catch (pmErr) {
                            logger.warn('[plugins] Load error:', pmErr.message);
                        }
                    });

                    // ── 4. Update DB async (non-blocking) ────────────────────
                    setImmediate(async () => {
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
                            logger.error('[PAIR] DB update failed on open:', dbErr.message);
                        }
                    });

                    // ── 5. Owner connection notification (non-blocking) ───────
                    setImmediate(() => sendConnectionNotification(sock));

                    const elapsed = Date.now() - connectionStart;
                    console.log(`[PAIR] Connection completed in ${elapsed}ms`);
                    console.log('[PAIR] Pairing flow completed');

                } else if (connection === 'close') {
                    const statusCode      = lastDisconnect?.error?.output?.statusCode;
                    const boomPayload     = lastDisconnect?.error?.output?.payload || {};
                    const disconnectMsg   = lastDisconnect?.error?.message || 'unknown';
                    const isLoggedOut     = statusCode === DisconnectReason.loggedOut;   // 401
                    const isTimedOut      = statusCode === 408;
                    const shouldReconnect = !isLoggedOut;

                    // Update session state
                    sessionState = isLoggedOut ? 'logged_out' : 'closed';

                    // Safe diagnostic log — no credentials, no keys
                    logger.warn(`[WhatsApp] Connection closed.`);
                    logger.warn(`[PAIR] Status code      : ${statusCode}`);
                    logger.warn(`[PAIR] Disconnect reason: ${disconnectMsg}`);
                    logger.warn(`[PAIR] Session state    : ${sessionState}`);
                    logger.warn(`[PAIR] Will reconnect   : ${shouldReconnect}`);

                    if (isTimedOut) {
                        // 408 = WhatsApp did not receive the authentication handshake
                        // in time. This is a temporary condition — the socket can reconnect.
                        // Common causes: slow network, pairing code not entered in time.
                        logger.warn('[PAIR] 408 — Connection timed out waiting for authentication. Will reconnect.');
                    }

                    if (isLoggedOut) {
                        // 401 = WhatsApp rejected the session credentials.
                        // This can happen if:
                        //   - The pairing code was never confirmed in WhatsApp
                        //   - Credentials were corrupted (e.g. by a duplicate socket write)
                        //   - The user manually logged out from WhatsApp devices list
                        // We do NOT automatically delete credentials — the user must do this
                        // intentionally from the web panel.
                        logger.error('[PAIR] 401 — Authentication/session rejected by WhatsApp.');
                        logger.error('[PAIR] Reconnect disabled. Existing credentials preserved.');
                        logger.error('[PAIR] To re-pair: use the web panel disconnect button, then pair again.');
                    }

                    if (global.io) {
                        global.io.emit('whatsapp:close');
                        global.io.emit('bot_status_update', {
                            status:     shouldReconnect ? 'connecting' : 'disconnected',
                            statusCode,
                            isLoggedOut
                        });
                    }

                    // Async DB update on close
                    setImmediate(async () => {
                        try {
                            const botJid   = sock.user?.id || '';
                            const botNum   = botJid.split('@')[0].split(':')[0];
                            const bot      = await Bot.findOne({ phoneNumber: botNum });
                            if (bot) {
                                await bot.update({ status: shouldReconnect ? 'connecting' : 'disconnected' });
                                if (global.io) {
                                    global.io.emit('bot_status_update', {
                                        botId: bot.id,
                                        status: shouldReconnect ? 'connecting' : 'disconnected'
                                    });
                                }
                            }
                        } catch (dbErr) {
                            logger.error('DB update failed on connection close:', dbErr.message);
                        }
                    });

                    global.conn = null;
                    activeSockets.delete('main');
                    initPromise = null;

                    if (shouldReconnect) {
                        const backoff = getBackoffMs();
                        logger.info(`[WhatsApp] Reconnecting in ${backoff / 1000}s (attempt ${reconnectAttempts})...`);
                        setTimeout(() => {
                            // Reset sessionState before new socket creation
                            sessionState = 'created';
                            initSocket();
                        }, backoff);
                    } else {
                        // 401 — session permanently rejected
                        // Reset notification guard so next real pair sends the success notification
                        pairSuccessNotified = false;
                        reconnectAttempts   = 0;
                        // Do NOT delete credentials automatically.
                        // The user must explicitly disconnect + delete from the web panel.
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

/**
 * Generate a pairing code for a phone number.
 *
 * FIXES:
 *   1. waitForWsReady() no longer resolves early on stale global.qrCode or
 *      on 'connecting' state — it waits for the actual QR event which confirms
 *      the noise handshake is complete and requestPairingCode() is safe to call.
 *   2. sessionState is checked before calling requestPairingCode() — if the
 *      socket is already 'authenticated' we don't re-pair.
 *   3. sessionState is set to 'pairing' after the code is requested, so
 *      waitForWsReady fast-path correctly identifies in-progress pairing.
 */
const createBotSession = async (phoneNumber) => {
    const pairStart = Date.now();
    console.log(`[PAIR] Request received for: ${phoneNumber}`);
    console.log('[PAIR] Validating number');
    console.log(`[PAIR] Current session state: ${sessionState}`);
    console.log('[PAIR] Creating/reusing socket...');

    const sock = await initSocket();

    // If already authenticated, return early — no pairing needed
    if (sessionState === 'authenticated' && sock.user) {
        const pairMs = Date.now() - pairStart;
        console.log(`[PAIR] Socket already authenticated — no pairing needed (${pairMs}ms)`);
        throw new Error('Session already authenticated. Disconnect first before re-pairing.');
    }

    console.log('[PAIR] Waiting for socket to reach qr_ready state...');
    await waitForWsReady(sock, 20000);

    const wsReadyMs = Date.now() - pairStart;
    console.log(`[PAIR] Socket ready in ${wsReadyMs}ms — sessionState: ${sessionState}`);
    console.log('[PAIR] Requesting pairing code...');

    // Mark state as pairing before calling — prevents concurrent re-entry
    sessionState = 'pairing';

    const code = await sock.requestPairingCode(phoneNumber);

    const codeMs = Date.now() - pairStart;
    console.log(`[PAIR] Pairing code generated: ${code}`);
    console.log(`[PAIR] Code generation completed in ${codeMs}ms`);
    console.log('[PAIR] Waiting for WhatsApp authentication (socket runs in background)...');

    return code;
};

// ── Safe command executor ─────────────────────────────────────────────────────
/**
 * Executes a registered command safely.
 * Logs full details on failure. Sends user-friendly error (no sensitive info).
 */
async function safeExecuteCommand(cmd, sock, mek, contextObj) {
    const commandName = contextObj.body?.slice((config.PREFIX || '.').length).trim().split(' ')[0].toLowerCase() || 'unknown';
    const pluginFile  = cmd.meta?.filename ? require('path').basename(cmd.meta.filename) : (cmd.filename || 'unknown');

    logger.info(`[NovaX:CMD] command received: ${commandName} | plugin: ${pluginFile} | sender: ${contextObj.sender} | chat: ${contextObj.from}`);

    try {
        if (typeof cmd.handler === 'function') {
            await cmd.handler(sock, mek, mek, contextObj);
        } else if (typeof cmd.function === 'function') {
            await cmd.function(sock, contextObj);
        } else {
            logger.warn(`[NovaX:CMD] Command "${commandName}" has no handler or function.`);
            return;
        }

        logger.info(`[NovaX:CMD] command completed: ${commandName}`);

        // ⚡ Buffer command-executed stat (no per-command DB query)
        statsBuffer.commandsExecuted++;

    } catch (cmdErr) {
        // Full error log for developers (never shown to user)
        logger.error(
            `[NovaX:ERROR]\n` +
            `  Command   : ${commandName}\n` +
            `  Plugin    : ${pluginFile}\n` +
            `  Sender    : ${contextObj.sender}\n` +
            `  Chat      : ${contextObj.from}\n` +
            `  Timestamp : ${new Date().toISOString()}\n` +
            `  Error     : ${cmdErr.message}\n` +
            `  Stack     : ${cmdErr.stack}`
        );

        // User-facing error — redact sensitive info
        const safeError = cmdErr.message
            ? cmdErr.message
                .replace(/\/[^\s]+/g, '[path]')     // hide file paths
                .replace(/https?:\/\/[^\s]+/g, '[url]') // hide URLs
                .substring(0, 120)
            : 'Unknown error';

        try {
            await sock.sendMessage(
                contextObj.from,
                {
                    text:
                        `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n` +
                        `┃ ❌ Command failed.\n` +
                        `┃\n` +
                        `┃ 🔌 *Plugin:* ${pluginFile}\n` +
                        `┃ 📋 *Error:* ${safeError}\n` +
                        `┃\n` +
                        `┃ Please try again.\n` +
                        `╰━━━━━━━━━━━━━━━┈`
                },
                { quoted: mek }
            );
        } catch (_) {}
    }
}

// Helper to recursively unwrap Baileys message structures (ephemeral, view-once, etc.)
function unwrapMessage(msg) {
    if (!msg) return msg;
    if (msg.ephemeralMessage?.message) return unwrapMessage(msg.ephemeralMessage.message);
    if (msg.viewOnceMessage?.message) return unwrapMessage(msg.viewOnceMessage.message);
    if (msg.viewOnceMessageV2?.message) return unwrapMessage(msg.viewOnceMessageV2.message);
    if (msg.documentWithCaptionMessage?.message) return unwrapMessage(msg.documentWithCaptionMessage.message);
    return msg;
}

// Helper to extract clean button click responses from multiple possible WhatsApp response structures
function extractInteractiveResponse(rawMsg) {
    if (!rawMsg) return null;
    const type = getContentType(rawMsg);
    let id = '';
    let text = '';

    if (type === 'buttonsResponseMessage') {
        id = rawMsg.buttonsResponseMessage?.selectedButtonId || '';
        text = rawMsg.buttonsResponseMessage?.selectedDisplayText || '';
    } else if (type === 'interactiveResponseMessage') {
        try {
            const native = rawMsg.interactiveResponseMessage?.nativeFlowResponseMessage;
            const params = JSON.parse(native?.paramsJson || '{}');
            id = params.id || '';
            text = rawMsg.interactiveResponseMessage?.body?.text || '';
        } catch (_) {}
    } else if (type === 'listResponseMessage') {
        id = rawMsg.listResponseMessage?.singleSelectReply?.selectedRowId || '';
        text = rawMsg.listResponseMessage?.title || '';
    } else if (type === 'templateButtonReplyMessage') {
        id = rawMsg.templateButtonReplyMessage?.selectedId || '';
        text = rawMsg.templateButtonReplyMessage?.selectedDisplayText || '';
    }

    if (id) {
        return { type, id, text };
    }
    return null;
}

// Setup message handlers
const setupMessageHandlers = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || !messages.length) return;
        const mek = messages[0];
        if (!mek?.message || mek.key.remoteJid === 'status@broadcast') return;

        const from = mek.key.remoteJid;
        const prefix = config.PREFIX || '.';

        // ── Normalization Layer ──
        const rawMsg = unwrapMessage(mek.message);
        if (!rawMsg) return;

        const rawType = getContentType(rawMsg);
        const interaction = extractInteractiveResponse(rawMsg);
        const isButton = !!interaction;
        const buttonId = isButton ? interaction.id : '';
        const buttonText = isButton ? interaction.text : '';

        const reply = textMsg => sock.sendMessage(from, { text: textMsg }, { quoted: mek });

        // ── 1. Category & Back Button Interceptor (BEFORE normal routing) ──
        if (isButton && buttonId) {
            console.log(`[BUTTON DEBUG]`);
            console.log(`raw message type: ${rawType}`);
            console.log(`interactive type: ${interaction.type}`);
            console.log(`raw paramsJson: ${rawMsg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || 'N/A'}`);
            console.log(`extracted id: ${buttonId}`);
            console.log(`extracted text: ${buttonText}`);

            // A. Back button handler
            if (buttonId === 'menu_back') {
                console.log(`[MENU] Back button clicked — returning to main menu`);
                const menuCmd = (global.commands || []).find(c => c.pattern === 'menu');
                if (menuCmd && typeof menuCmd.handler === 'function') {
                    await menuCmd.handler(sock, mek, mek, { from, sender: mek.key.participant || from, isOwner: false, isGroup: from.endsWith('@g.us'), reply, body: `${prefix}menu`, args: [], q: '', text: '', quoted: null, botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '', config });
                }
                return;
            }

            // B. Category selections (category:downloader, category:ai, category:tools)
            if (buttonId.startsWith('category:')) {
                const categoryName = buttonId.split(':')[1];
                console.log(`[MENU] Category detected: ${categoryName}`);

                const allMenuCmd = (global.commands || []).find(c => c.pattern === 'allmenu');
                if (allMenuCmd && typeof allMenuCmd.handler === 'function') {
                    console.log(`[MENU] Routing directly to allmenu handler with category: ${categoryName}`);
                    await allMenuCmd.handler(sock, mek, mek, { from, sender: mek.key.participant || from, isOwner: false, isGroup: from.endsWith('@g.us'), reply, body: `${prefix}allmenu ${categoryName}`, args: [categoryName], q: categoryName, text: categoryName, quoted: null, botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '', config });
                } else {
                    console.log(`[MENU] allmenu handler not found for category: ${categoryName}`);
                    await reply('⚠️ Category menu is currently unavailable.');
                }
                return;
            }

            // C. Built-in welcome actions
            if (buttonId === 'novax_menu') {
                const menuCmd = (global.commands || []).find(c => c.pattern === 'menu');
                if (menuCmd) {
                    await menuCmd.handler(sock, mek, mek, { from, sender: mek.key.participant || from, isOwner: false, isGroup: from.endsWith('@g.us'), reply, body: `${prefix}menu`, args: [], q: '', text: '', quoted: null, botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '', config });
                }
                return;
            }
            if (buttonId === 'novax_settings') {
                const settingsCmd = (global.commands || []).find(c => ['settings', 'setting', 'mode', 'config'].includes(c.pattern));
                if (settingsCmd) {
                    await settingsCmd.handler(sock, mek, mek, { from, sender: mek.key.participant || from, isOwner: true, isGroup: from.endsWith('@g.us'), reply, body: `${prefix}settings`, args: [], q: '', text: '', quoted: null, botNumber: sock.user?.id?.split('@')[0]?.split(':')[0] || '', config });
                }
                return;
            }
            if (buttonId === 'contact_owner') {
                const ownerNum = config.OWNER_NUMBER || '94789737967';
                await reply(`📞 Contact the owner: wa.me/${ownerNum}`);
                return;
            }
        }

        // ── 2. Command Extraction & Routing ──
        let body = '';
        if (isButton && buttonId) {
            // Normal buttons (like command triggers) get prefix prepended if missing
            if (!buttonId.startsWith(prefix)) {
                body = prefix + buttonId;
            } else {
                body = buttonId;
            }
        } else {
            body = rawType === 'conversation'
                ? rawMsg.conversation
                : rawMsg[rawType]?.text || rawMsg[rawType]?.caption || '';
        }

        try {
            if (!body || !body.startsWith(prefix)) return;

            const commandName = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            if (!commandName) return;

            const args      = body.trim().split(/ +/).slice(1);
            const q         = args.join(' ');
            const text      = q;
            const sender    = mek.key.fromMe ? (sock.user?.id || '') : (mek.key.participant || from);
            const senderNumber = sender.split('@')[0].split(':')[0];
            const isOwner   = (config.OWNER_NUMBER || '94789737967').split(',').map(n => n.trim()).includes(senderNumber);
            const quoted    = rawMsg[rawType]?.contextInfo?.quotedMessage || null;
            const botNumber = sock.user ? sock.user.id.split('@')[0].split(':')[0] : '';

            // ⚡ Buffered stats
            statsBuffer.messagesReceived++;
            scheduleStatsFlush(botNumber);

            // Group metadata
            let groupMetadata = null;
            let groupAdmins   = [];
            let isAdmins      = false;
            let isBotAdmins   = false;

            if (from.endsWith('@g.us')) {
                try {
                    groupMetadata = await sock.groupMetadata(from).catch(() => null);
                    if (groupMetadata) {
                        groupAdmins = groupMetadata.participants
                            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                            .map(p => p.id);
                        isAdmins    = groupAdmins.includes(sender);
                        const botJid = sock.user ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
                        isBotAdmins = groupAdmins.some(a => a.startsWith(botJid.split('@')[0]));
                    }
                } catch (_) {}
            }

            const cmd = (global.commands || []).find(c => c.pattern === commandName && c.enabled !== false);
            if (!cmd) {
                if (isButton) {
                    console.log(`[BUTTON DEBUG] Unknown button ID: ${buttonId}`);
                    await reply('⚠️ This button is currently unavailable. Please try the command again.');
                }
                return;
            }

            // Owner / Group / Admin permission checks
            if (cmd.owner && !isOwner) return reply('🚫 This command is only for the Owner!');
            if (cmd.group && !from.endsWith('@g.us')) return reply('❌ This command can only be used in groups.');
            if (cmd.admin && !isAdmins) return reply('❌ Only group admins can use this command.');

            const contextObj = {
                from,
                sender,
                isOwner,
                isGroup: from.endsWith('@g.us'),
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

            if (isButton) {
                console.log(`[BUTTON DEBUG] matched command: ${commandName}`);
                console.log(`[BUTTON DEBUG] matched plugin: ${cmd.filename ? path.basename(cmd.filename) : 'N/A'}`);
                console.log(`[BUTTON DEBUG] handler executing...`);
            }

            await safeExecuteCommand(cmd, sock, mek, contextObj);

            if (isButton) {
                console.log(`[BUTTON DEBUG] response sent successfully`);
            }

        } catch (err) {
            logger.error('[botService] Message handler error:', err.message);
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
        // Reset pair notification flag on explicit disconnect
        pairSuccessNotified = false;
        reconnectAttempts   = 0;
        await Bot.update({ status: 'disconnected' }, { where: { id: botId } });
    }
};

module.exports = {
    initSocket,
    createBotSession,
    getBotStatus,
    updateBotSettings,
    disconnectBot,
    pairingLocks,  // ← exported so routes can check per-phone lock status
    getSessionState: () => sessionState  // ← health check: WS open ≠ WA authenticated
};
