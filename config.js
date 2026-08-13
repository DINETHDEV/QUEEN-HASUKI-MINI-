/**
 * NovaX Bot — Configuration
 * Copyright © 2025 Zero Bug Zone
 * Owner: Dineth Sudarshana
 */

// Load .env first so process.env is populated
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

module.exports = {
    // ── Application ──────────────────────────────────
    APP_NAME:        'NovaX Mini',
    APP_VERSION:     process.env.BOT_VERSION     || '3.0.0',
    APP_DESCRIPTION: 'Advanced WhatsApp Bot Management System',

    // ── Server ───────────────────────────────────────
    PORT:     process.env.PORT     || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // ── Database ─────────────────────────────────────
    DATABASE_URL: process.env.DATABASE_URL || 'local',

    // ── JWT ──────────────────────────────────────────────
    JWT_SECRET:     process.env.JWT_SECRET     || 'novax-mini-jwt-secret-key-2025',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // ── Email ────────────────────────────────────────
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NovaX Bot <noreply@novax.bot>',

    // ── Admin ────────────────────────────────────────────────
    ADMIN_EMAIL:    process.env.ADMIN_EMAIL    || 'admin@novax-mini.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

    // ── Google OAuth 2.0 ─────────────────────────────────────
    GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID     || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/auth/google/callback',
    // Comma-separated list of emails that are granted admin on first Google login
    GOOGLE_ADMIN_EMAILS:  process.env.GOOGLE_ADMIN_EMAILS  || '',

    // ── Session (used only for OAuth state handshake) ─────────
    SESSION_SECRET: process.env.SESSION_SECRET || 'novax-session-secret-change-me',

    // ── WhatsApp Bot ───────────────────────────────────
    BOT_NAME:        process.env.BOT_NAME        || 'NovaX Mini',
    BOT_VERSION:     process.env.BOT_VERSION     || '3.0.0',
    BOT_FOOTER:      process.env.BOT_FOOTER      || '> © 2025 Zero Bug Zone',
    PREFIX:          process.env.PREFIX           || '.',
    OWNER_NAME:      process.env.OWNER_NAME      || 'Dineth Sudarshana',
    OWNER_NUMBER:    process.env.OWNER_NUMBER    || '94789737967',
    PHONE_NUMBER:    process.env.PHONE_NUMBER    || '94789737967',
    USE_PAIRING_CODE: process.env.USE_PAIRING_CODE === 'true',
    CONNECTION_NOTIFY_NUMBER: process.env.CONNECTION_NOTIFY_NUMBER || '',

    // ── Bot Appearance ───────────────────────────────
    IMAGE_PATH:   process.env.IMAGE_PATH   || 'https://files.catbox.moe/aeg27n.png',
    CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A',

    // ── Sticker ──────────────────────────────────────
    PACK_NAME:   process.env.PACK_NAME   || 'NovaX Mini',
    PACK_AUTHOR: process.env.PACK_AUTHOR || 'ZeroBugZone',

    // ── Language ─────────────────────────────────────
    LANGUAGE: (process.env.LANGUAGE || 'en').toLowerCase(),

    // ── Feature Flags ────────────────────────────────
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS !== 'false',
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS !== 'false',
    AUTO_RECORDING:   process.env.AUTO_RECORDING   !== 'false',
    AUTO_TYPING:      process.env.AUTO_TYPING       === 'true',
    ANTI_CALL:        process.env.ANTI_CALL         === 'true',
    ANTI_DELETE:      process.env.ANTI_DELETE       === 'true',
    AUTO_LIKE_EMOJI:  ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋'],

    // ── Plugin Directories ───────────────────────────
    EXTERNAL_PLUGIN_DIR: process.env.EXTERNAL_PLUGIN_DIR || '',

    // ── Rate Limiting ────────────────────────────────
    RATE_LIMIT_WINDOW: 15 * 60 * 1000,
    RATE_LIMIT_MAX:    100,

    // ── File Upload ──────────────────────────────────
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    UPLOAD_PATH:   './uploads',
    MAX_RETRIES:   3,

    // ── GitHub ───────────────────────────────────────
    GITHUB_TOKEN:      process.env.GITHUB_TOKEN       || '',
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER  || 'ZeroBugZone417',
    GITHUB_REPO_NAME:  process.env.GITHUB_REPO_NAME   || 'NOVAX-MINI',

    // ── Copyright ────────────────────────────────────
    COPYRIGHT: {
        COMPANY: 'Zero Bug Zone',
        OWNER:   'Dineth Sudarshana',
        GITHUB:  'https://github.com/ZeroBugZone417',
        YEAR:    new Date().getFullYear()
    }
};
