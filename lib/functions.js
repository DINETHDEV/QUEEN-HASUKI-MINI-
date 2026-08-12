/**
 * NovaX Bot — functions.js
 * Shared utility helpers for plugins
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

// ── sleep / delay ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Format bytes ──────────────────────────────────────────────────────────────
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k    = 1024;
    const dm   = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i    = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// ── Format uptime ─────────────────────────────────────────────────────────────
function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ── Chunk array ───────────────────────────────────────────────────────────────
function chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

// ── Random pick ───────────────────────────────────────────────────────────────
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── Escape regex ──────────────────────────────────────────────────────────────
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Truncate string ───────────────────────────────────────────────────────────
function truncate(str, maxLen = 100) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}

// ── Is JID a group ────────────────────────────────────────────────────────────
function isGroup(jid) {
    return jid && jid.endsWith('@g.us');
}

// ── Strip JID user ────────────────────────────────────────────────────────────
function getPhoneFromJid(jid) {
    return jid ? jid.split('@')[0].split(':')[0] : '';
}

module.exports = {
    sleep,
    formatBytes,
    formatUptime,
    chunk,
    randomPick,
    escapeRegex,
    truncate,
    isGroup,
    getPhoneFromJid,
    // Alias
    delay: sleep,
};
