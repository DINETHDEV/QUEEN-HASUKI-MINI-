/**
 * Bot Management Routes (MongoDB + Web Panel API)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const express = require('express');
const QRCode = require('qrcode');
const { Bot } = require('../database/models');
const { authenticateToken } = require('../middleware/auth');
const { botLimiter } = require('../middleware/rateLimiter');
const { initSocket, createBotSession, getBotStatus, updateBotSettings } = require('../services/botService');
const { getMongoStatus } = require('../database/connection');
const pluginManager = require('../lib/pluginManager');
const dbLib = require('../lib/database');
const logger = require('../lib/logger');

const router = express.Router();

// ── Status Endpoint ───────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
    try {
        const uptime = process.uptime();
        const mem = process.memoryUsage();
        const mongoStatus = getMongoStatus();
        const pluginStats = pluginManager.stats();

        res.json({
            success: true,
            status: 'online',
            uptime,
            nodeVersion: process.version,
            baileysVersion: '0.3.18-final',
            mongodb: mongoStatus,
            memory: {
                rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
                heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
            },
            plugins: pluginStats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
});

// ── Settings Endpoints ────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
    try {
        const settings = await dbLib.getAllSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const newSettings = req.body;
        if (!newSettings || typeof newSettings !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid settings body' });
        }

        await dbLib.updateSettings(newSettings);

        if (global.io) {
            global.io.emit('bot_settings_update', newSettings);
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: newSettings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// ── Plugin Management Endpoints ───────────────────────────────────────────────
router.get('/plugins', (req, res) => {
    try {
        const list = pluginManager.listPlugins();
        res.json({
            success: true,
            count: list.length,
            data: list
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch plugins' });
    }
});

router.post('/plugins/:name/enable', async (req, res) => {
    try {
        const result = await pluginManager.enablePlugin(req.params.name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/plugins/:name/disable', async (req, res) => {
    try {
        const result = await pluginManager.disablePlugin(req.params.name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/plugins/:name/reload', (req, res) => {
    try {
        const result = pluginManager.reloadPlugin(req.params.name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/plugins/bulk/enable-all', async (req, res) => {
    try {
        const results = await pluginManager.enableAll();
        const ok = results.filter(r => r.success).length;
        res.json({ success: true, message: `Enabled ${ok}/${results.length} plugins`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/plugins/bulk/disable-all', async (req, res) => {
    try {
        const results = await pluginManager.disableAll();
        const ok = results.filter(r => r.success).length;
        res.json({ success: true, message: `Disabled ${ok}/${results.length} plugins`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Command List Endpoint ─────────────────────────────────────────────────────
router.get('/commands', (req, res) => {
    try {
        const cmds = (global.commands || []).map(c => ({
            pattern: c.pattern,
            desc: c.desc || '',
            category: c.category || 'general',
            enabled: c.enabled !== false,
            primary: c.primary || c.pattern
        }));
        res.json({
            success: true,
            count: cmds.length,
            data: cmds
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch commands' });
    }
});

// ── Logs Endpoint ─────────────────────────────────────────────────────────────
router.get('/logs', (req, res) => {
    try {
        const logs = logger.getLogs(100);
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
});

// ── Multi-Bot Management Routes ──────────────────────────────────────────────
router.get('/my-bots', authenticateToken, async (req, res) => {
    try {
        const bots = await Bot.findAll({ where: { userId: req.user.id } });
        res.json({ success: true, data: bots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch bots' });
    }
});

router.post('/create', authenticateToken, botLimiter, async (req, res) => {
    try {
        const { phoneNumber, botName } = req.body;
        if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });

        const existingBot = await Bot.findOne({ phoneNumber });
        if (existingBot) return res.status(409).json({ success: false, message: 'Bot with this phone number already exists' });

        const bot = await Bot.create({
            userId: req.user.id,
            phoneNumber,
            botName: botName || 'NovaX Mini',
            status: 'disconnected'
        });

        res.status(201).json({ success: true, message: 'Bot created successfully', data: bot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create bot' });
    }
});

let pairingInProgress = false;

// Normalize phone numbers to Baileys format
function normalizePhoneNumber(num) {
    if (!num || typeof num !== 'string') return null;
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        cleaned = '94' + cleaned.substring(1);
    }
    if (cleaned.length >= 10 && cleaned.length <= 15) {
        return cleaned;
    }
    return null;
}

router.post('/pair', authenticateToken, botLimiter, async (req, res) => {
    try {
        const { botId, phoneNumber } = req.body;

        let targetPhone = phoneNumber;
        let bot = null;

        if (botId) {
            bot = await Bot.findOne({ id: botId, userId: req.user.id });
            if (!bot) {
                return res.status(404).json({ success: false, message: 'Bot not found' });
            }
            targetPhone = bot.phoneNumber;
        }

        if (!targetPhone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhoneNumber(targetPhone);
        if (!normalizedPhone) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format. Must be 10-15 digits.' });
        }

        // ── LOCK CHECK ──
        if (pairingInProgress) {
            return res.status(409).json({ success: false, error: 'Pairing already in progress' });
        }
        pairingInProgress = true;

        if (global.io) {
            global.io.emit('pairing:started', { phoneNumber: normalizedPhone });
        }

        // Check if an authenticated session already exists
        if (global.conn && global.conn.user) {
            pairingInProgress = false;
            return res.status(400).json({ success: false, message: 'An active session already exists. Disconnect first.' });
        }

        // ── TIMEOUT PROMISE ──
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 25000); // 25s timeout
        });

        try {
            const rawCode = await Promise.race([
                createBotSession(normalizedPhone),
                timeoutPromise
            ]);

            // Format code to XXXX-XXXX format if it's 8 characters
            let formattedCode = rawCode;
            if (rawCode && rawCode.length === 8 && !rawCode.includes('-')) {
                formattedCode = rawCode.substring(0, 4) + '-' + rawCode.substring(4);
            }

            if (bot) {
                await bot.update({ pairingCode: formattedCode, status: 'connecting' });
            }

            if (global.io) {
                global.io.emit('pairing:code', { pairingCode: formattedCode });
                if (bot) {
                    global.io.to(`user_${req.user.id}`).emit('bot_status_update', {
                        botId: bot.id,
                        status: 'connecting',
                        pairingCode: formattedCode
                    });
                }
            }

            pairingInProgress = false;
            res.json({ success: true, pairingCode: formattedCode, data: { pairingCode: formattedCode } });
        } catch (err) {
            pairingInProgress = false;
            const errMsg = err.message === 'TIMEOUT'
                ? 'Unable to generate pairing code. Check WhatsApp connection and phone number.'
                : `Pairing code generation failed: ${err.message}`;

            if (global.io) {
                global.io.emit('pairing:error', { error: errMsg });
            }
            res.status(500).json({ success: false, error: errMsg, message: errMsg });
        }
    } catch (error) {
        pairingInProgress = false;
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/qr', authenticateToken, botLimiter, async (req, res) => {
    try {
        const { botId } = req.body;
        // Start the socket connection if it's not active
        await initSocket();

        // Wait up to 10 seconds for a QR code to be generated if one is not cached
        if (!global.qrCode) {
            let retries = 20;
            while (retries > 0 && !global.qrCode) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries--;
            }
        }

        if (global.qrCode) {
            const qrImageUrl = await QRCode.toDataURL(global.qrCode);
            res.json({ success: true, qrCode: qrImageUrl, data: { qrCode: qrImageUrl } });
        } else {
            res.status(404).json({ success: false, message: 'QR Code not available. Is the bot already connected?' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Delete Bot (user-scoped) ──────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const bot = await Bot.findOne({ id: req.params.id, userId: req.user.id });
        if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });

        await bot.destroy();
        res.json({ success: true, message: 'Bot deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete bot' });
    }
});

// ── Update Bot Settings ───────────────────────────────────────────────────
router.put('/settings/:id', authenticateToken, async (req, res) => {
    try {
        const bot = await Bot.findOne({ id: req.params.id, userId: req.user.id });
        if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });

        const allowedSettings = ['autoViewStatus', 'autoLikeStatus', 'autoRecording', 'antiCall', 'prefix', 'autoReact', 'antiDelete'];
        const settings = { ...(bot.settings || {}) };
        for (const key of allowedSettings) {
            if (req.body[key] !== undefined) settings[key] = req.body[key];
        }

        const updateData = { settings };
        if (req.body.botName) updateData.botName = req.body.botName;

        await bot.update(updateData);

        if (global.io) {
            global.io.to(`user_${req.user.id}`).emit('bot_settings_update', { botId: bot.id, settings });
        }

        res.json({ success: true, message: 'Bot settings updated', data: bot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update bot settings' });
    }
});

// ── Disconnect Bot ────────────────────────────────────────────────────────
router.post('/disconnect/:id', authenticateToken, async (req, res) => {
    try {
        const bot = await Bot.findOne({ id: req.params.id, userId: req.user.id });
        if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });

        // Actually close the live socket, not just update the DB
        if (global.conn) {
            try {
                await global.conn.logout().catch(() => {});
            } catch (_) {}
            try {
                global.conn.ws?.close();
            } catch (_) {}
            global.conn = null;
        }

        // Reset pairing lock if stuck
        const { disconnectBot } = require('../services/botService');
        try { await disconnectBot(bot.id); } catch (_) {}

        await bot.update({ status: 'disconnected', pairingCode: null });

        if (global.io) {
            global.io.emit('whatsapp:close');
            global.io.to(`user_${req.user.id}`).emit('bot_status_update', { botId: bot.id, status: 'disconnected' });
        }

        res.json({ success: true, message: 'Bot disconnected' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to disconnect bot' });
    }
});

module.exports = router;