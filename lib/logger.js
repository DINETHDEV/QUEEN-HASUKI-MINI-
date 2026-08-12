/**
 * NovaX Bot — Structured Logger
 * Copyright © 2025 Zero Bug Zone
 */

const chalk = require('chalk');

// ── Log level colours ────────────────────────────────────────────────────────
const LEVELS = {
    INFO:    { label: 'INFO',    color: chalk.cyan,    icon: '🔵' },
    WARN:    { label: 'WARN',    color: chalk.yellow,  icon: '🟡' },
    ERROR:   { label: 'ERROR',   color: chalk.red,     icon: '🔴' },
    DEBUG:   { label: 'DEBUG',   color: chalk.magenta, icon: '🟣' },
    SUCCESS: { label: 'SUCCESS', color: chalk.green,   icon: '🟢' },
};

// ── In-memory log buffer (last 500 entries) ───────────────────────────────────
const logBuffer = [];
const MAX_BUFFER = 500;

function addToBuffer(entry) {
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER) logBuffer.shift();
    // Emit to web panel via Socket.IO if available
    if (global.io) {
        try { global.io.emit('log', entry); } catch (_) {}
    }
}

// ── Mask sensitive values ────────────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
    /password/i, /token/i, /secret/i, /key/i, /auth/i,
    /creds?/i, /session/i, /cookie/i, /jwt/i
];

function maskSensitive(msg) {
    let masked = String(msg);
    SENSITIVE_PATTERNS.forEach(p => {
        masked = masked.replace(
            new RegExp(`(${p.source}\\s*[:=]\\s*)[^\\s,}"']+`, 'gi'),
            '$1[REDACTED]'
        );
    });
    return masked;
}

// ── Core log function ────────────────────────────────────────────────────────
function log(level, ...args) {
    const levelCfg = LEVELS[level] || LEVELS.INFO;
    const timestamp = new Date().toISOString();
    const message   = args.map(a =>
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ');
    const safeMsg = maskSensitive(message);

    // Console output
    const prefix = levelCfg.color(`[${levelCfg.label}]`);
    const ts     = chalk.gray(timestamp);
    console.log(`${ts} ${levelCfg.icon} ${prefix} ${safeMsg}`);

    // Buffer for web panel
    const entry = { level, timestamp, message: safeMsg };
    addToBuffer(entry);
}

// ── Public API ───────────────────────────────────────────────────────────────
const logger = {
    info:    (...a) => log('INFO',    ...a),
    warn:    (...a) => log('WARN',    ...a),
    error:   (...a) => log('ERROR',   ...a),
    debug:   (...a) => log('DEBUG',   ...a),
    success: (...a) => log('SUCCESS', ...a),
    getLogs: (limit = 100) => logBuffer.slice(-limit),
    clearLogs: () => { logBuffer.length = 0; },
};

module.exports = logger;
