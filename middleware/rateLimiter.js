/**
 * Rate Limiting Middleware
 *
 * FIXES:
 *   1. Removed `validate: { trustProxy: false }` — that option does not exist
 *      in express-rate-limit v7 and silently bypasses the proxy validation,
 *      meaning limits were applied against the proxy's IP, not the real client.
 *   2. The correct fix for ERR_ERL_UNEXPECTED_X_FORWARDED_FOR is to configure
 *      Express `trust proxy` on the app (done in index.js), not to disable the
 *      rate-limit validation here.
 *   3. If you ever need to explicitly suppress the X-Forwarded-For check (e.g.
 *      during local dev without a proxy), the correct option is:
 *        validate: { xForwardedForHeader: false }
 *      NOT `validate: { trustProxy: false }`.
 *
 * Copyright © 2025 DarkSide Developers
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later.'
        },
        standardHeaders: true,   // Return RateLimit-* headers
        legacyHeaders:   false   // Disable X-RateLimit-* legacy headers
        // No `validate` override needed — Express trust proxy is set in index.js
    });
};

const generalLimiter = createRateLimiter(
    config.RATE_LIMIT_WINDOW,
    config.RATE_LIMIT_MAX,
    'Too many requests from this IP'
);

const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5,              // 5 attempts
    'Too many authentication attempts'
);

const botLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    10,        // 10 requests per minute
    'Too many bot operations'
);

module.exports = {
    generalLimiter,
    authLimiter,
    botLimiter
};
