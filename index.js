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
const session = require('express-session');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

const config = require('./config');
const logger = require('./lib/logger');
const { connectDatabase } = require('./database/connection');
const { generalLimiter } = require('./middleware/rateLimiter');
const pluginManager = require('./lib/pluginManager');
const { router: googleAuthRouter, passport } = require('./routes/authGoogle');

// ===== EXPRESS SERVER =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// ── Trust Proxy ────────────────────────────────────────────────────────────────
// The app is deployed on Vercel (confirmed by vercel.json) which acts as a
// single reverse proxy and injects X-Forwarded-For.
// Setting trust proxy = 1 tells Express to trust the FIRST hop in the chain,
// so req.ip resolves to the real client IP and express-rate-limit works correctly.
//
// We also apply this in development so that any local reverse-proxy setup
// (ngrok, nginx, etc.) behaves consistently.
//
// We deliberately avoid `trust proxy = true` which would trust an unlimited
// chain and could allow IP spoofing via X-Forwarded-For manipulation.
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// ── Session (short-lived — only used for OAuth 2.0 state handshake) ────────
// The application itself uses JWT; this session is destroyed immediately
// after the OAuth callback issues a JWT and redirects to the frontend.
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   config.NODE_ENV === 'production',
        sameSite: 'lax',     // Required for OAuth redirect flow
        maxAge:   5 * 60 * 1000  // 5 minutes — enough for OAuth round-trip
    }
}));

// ── Passport (OAuth strategy middleware) ─────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Google OAuth Routes (outside /api/ — browser redirects required) ─────
// GET /auth/google          → Initiate Google consent
// GET /auth/google/callback → Handle Google callback, issue JWT, redirect
app.use('/auth', googleAuthRouter);

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
