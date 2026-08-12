/**
 * NovaX Mini — Main Server + WhatsApp Bot
 * Copyright © 2025 Zero Bug Zone
 * Owner: Dineth Sudarshana
 */

'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

const config = require('./config');
const logger = require('./lib/logger');
const { connectDatabase } = require('./database/connection');
const { generalLimiter } = require('./middleware/rateLimiter');
const pluginManager = require('./lib/pluginManager');

// ===== EXPRESS SERVER =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));

// Serve main page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// 404 & Error Handler
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
    logger.error('Server Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Socket.IO for real-time
global.io = io;
io.on('connection', socket => {
    logger.info('Web client connected:', socket.id);
    socket.on('disconnect', () => logger.info('Web client disconnected:', socket.id));
});

// ===== WHATSAPP BOT =====
const credsFolder = path.join(__dirname, 'auth_info_baileys');

// Initialize global commands
if (!global.commands) global.commands = [];

const { initSocket } = require('./services/botService');

async function startBot() {
    return await initSocket();
}

// ===== START SERVER =====
const startServer = async () => {
    try {
        // ──────────────────────────────────────────────────
        console.log('');
        console.log('  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
        console.log('  ┃                                    ┃');
        console.log('  ┃      N O V A  X   M I N I         ┃');
        console.log('  ┃         v3.0.0 by ZeroBugZone      ┃');
        console.log('  ┃                                    ┃');
        console.log('  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
        console.log('');

        await connectDatabase();
        await startBot();

        const PORT = config.PORT || 5000;
        server.listen(PORT, () => {
            logger.success(`🚀 NovaX Mini running at http://localhost:${PORT}`);
            console.log('');
            console.log('  ╔══════════════════════════════════╗');
            console.log('  ║  🟢 Status   : ONLINE                  ║');
            console.log(`  ║  🖥️  Web      : http://localhost:${PORT}    ║`);
            console.log('  ║  💿 Database  : MongoDB                  ║');
            console.log('  ║  🔌 WhatsApp  : Initializing...          ║');
            console.log('  ╚══════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

startServer();

module.exports = app;
