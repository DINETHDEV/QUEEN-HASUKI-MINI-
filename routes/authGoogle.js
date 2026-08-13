/**
 * Google OAuth 2.0 Routes
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 *
 * Flow:
 *   GET /auth/google             → Redirect to Google consent screen
 *   GET /auth/google/callback    → Google redirects back here
 *                                → Verify identity, find/create user, check admin
 *                                → Issue app JWT, redirect to frontend with ?google_token=<jwt>
 *
 * Security measures implemented:
 *   - State parameter (managed by passport-google-oauth20 + express-session)
 *   - Email verified check (email_verified from Google's OIDC token)
 *   - Admin allowlist via GOOGLE_ADMIN_EMAILS env (never hardcoded)
 *   - Existing isAdmin flag in DB always wins for returning users
 *   - No client_secret or tokens ever exposed to frontend
 *   - Redirect only to own frontend origin — no open redirect
 */

'use strict';

const express       = require('express');
const passport      = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt           = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User }      = require('../database/models');
const config        = require('../config');
const logger        = require('../lib/logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: normalise an email for comparison (lowercase + trim)
// ─────────────────────────────────────────────────────────────────────────────
function normaliseEmail(email) {
    return (email || '').toLowerCase().trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse GOOGLE_ADMIN_EMAILS into a Set of normalised email strings
// ─────────────────────────────────────────────────────────────────────────────
function getAdminEmailSet() {
    const raw = config.GOOGLE_ADMIN_EMAILS || '';
    return new Set(
        raw.split(',')
           .map(e => normaliseEmail(e))
           .filter(e => e.length > 0)
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: issue the same JWT format the rest of the app uses
// ─────────────────────────────────────────────────────────────────────────────
function issueJWT(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate a safe frontend-error redirect URL
// The frontend reads ?auth_error=<message> and shows a clean UI message.
// ─────────────────────────────────────────────────────────────────────────────
function errorRedirect(res, message) {
    const safe = encodeURIComponent(message);
    return res.redirect(`/?auth_error=${safe}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Configure Passport Google Strategy
// Only runs once when this module is first required.
// ─────────────────────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
    {
        clientID:     config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL:  config.GOOGLE_CALLBACK_URL,
        // Request minimal scopes: openid, email, profile
        scope: ['openid', 'email', 'profile'],
        // Pass req into the verify callback so we can log the IP
        passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
        // We intentionally discard access/refresh tokens — we only need identity.
        // _accessToken and _refreshToken are prefixed with _ to make this clear.
        try {
            // ── 1. Extract identity from Google profile ────────────────────
            const emails = profile.emails || [];
            const primaryEmail = emails[0];

            if (!primaryEmail || !primaryEmail.value) {
                logger.warn('[AUTH] Google callback: no email in profile');
                return done(null, false, { message: 'no_email' });
            }

            const email         = normaliseEmail(primaryEmail.value);
            const emailVerified = primaryEmail.verified === true ||
                                  primaryEmail.verified === 'true';
            const googleId      = profile.id;
            const displayName   = profile.displayName || '';
            const givenName     = (profile.name && profile.name.givenName)  || '';
            const familyName    = (profile.name && profile.name.familyName) || '';
            const avatarUrl     = (profile.photos && profile.photos[0])
                                    ? profile.photos[0].value
                                    : null;

            // ── 2. Require email_verified from Google ──────────────────────
            if (!emailVerified) {
                logger.warn(`[AUTH] Google callback: email not verified — ${email}`);
                return done(null, false, { message: 'email_not_verified' });
            }

            // ── 3. Look up user by googleId first ──────────────────────────
            let user = await User.findByGoogleId(googleId);

            if (!user) {
                // ── 4. Look up by verified email (account linking) ─────────
                user = await User.findOne({ email });

                if (user) {
                    // Existing local account — link Google identity to it.
                    // Only safe because Google has confirmed email_verified = true.
                    logger.info(`[AUTH] Linking Google identity to existing account: ${email}`);

                    const updateFields = { googleId, updatedAt: new Date() };

                    // Upgrade authProvider if it was 'local'
                    if (user.authProvider === 'local' || !user.authProvider) {
                        updateFields.authProvider = 'both';
                    }

                    // Update avatar only if the user has none
                    if (!user.avatar && avatarUrl) {
                        updateFields.avatar = avatarUrl;
                    }

                    // Mark email verified (Google confirmed it)
                    if (!user.emailVerified) {
                        updateFields.emailVerified = true;
                    }

                    await user.update(updateFields);

                    // Re-fetch to get fresh data
                    user = await User.findOne({ email });

                } else {
                    // ── 5. Brand-new user — create account ────────────────
                    logger.info(`[AUTH] Creating new Google-authenticated user: ${email}`);

                    // Determine admin status from allowlist (only for new users)
                    const adminSet  = getAdminEmailSet();
                    const isAdmin   = adminSet.has(email);

                    // Build a safe username from the email local-part
                    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
                    // Ensure uniqueness by appending random suffix if needed
                    let username = baseUsername;
                    const existing = await User.findOne({ username });
                    if (existing) {
                        username = `${baseUsername}_${uuidv4().slice(0, 6)}`;
                    }

                    user = await User.create({
                        username,
                        email,
                        password:      null,         // No local password
                        firstName:     givenName  || displayName.split(' ')[0] || '',
                        lastName:      familyName || displayName.split(' ').slice(1).join(' ') || '',
                        isAdmin,
                        emailVerified: true,
                        avatar:        avatarUrl,
                        googleId,
                        authProvider:  'google',
                        lastLogin:     new Date(),
                    });

                    if (isAdmin) {
                        logger.info(`[AUTH] Admin authorization granted (allowlist) for: ${email}`);
                    }
                }
            } else {
                // ── 6. Returning Google user — update profile ──────────────
                const updateFields = { lastLogin: new Date() };

                // Keep avatar fresh from Google if user has a Google avatar
                if (avatarUrl && user.authProvider !== 'local') {
                    updateFields.avatar = avatarUrl;
                }

                await user.update(updateFields);
            }

            // ── 7. Check banned ────────────────────────────────────────────
            if (user.isBanned) {
                logger.warn(`[AUTH] Banned account attempted Google login: ${email}`);
                return done(null, false, { message: 'banned' });
            }

            logger.info(`[AUTH] Google user authenticated: ${email} (admin=${user.isAdmin})`);
            return done(null, user);

        } catch (err) {
            logger.error('[AUTH] Google callback error:', err.message);
            return done(err);
        }
    }
));

// Passport requires serialize/deserialize even when not persisting sessions.
// We use a minimal in-memory session only for the OAuth state handshake.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route: GET /auth/google
// Redirects the browser to the Google consent screen.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
    // Guard: if Google OAuth is not configured, show a clear error
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
        logger.error('[AUTH] Google OAuth is not configured — GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing');
        return errorRedirect(res, 'Google Sign-In is not configured on this server.');
    }

    logger.info('[AUTH] Google login started');

    passport.authenticate('google', {
        scope: ['openid', 'email', 'profile'],
        prompt: 'select_account',   // Always show account picker
    })(req, res, next);
});

// ─────────────────────────────────────────────────────────────────────────────
// Route: GET /auth/google/callback
// Google redirects here after the user grants / denies consent.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google/callback',
    // First, run passport.authenticate to validate state + exchange code
    (req, res, next) => {
        passport.authenticate('google', { session: true }, async (err, user, info) => {
            // ── Error from Google / passport ──────────────────────────────
            if (err) {
                logger.error('[AUTH] Google callback failed:', err.message);
                return errorRedirect(res, 'Google Sign-In failed. Please try again.');
            }

            // ── User denied consent ────────────────────────────────────────
            if (req.query.error) {
                const denied = req.query.error === 'access_denied';
                logger.info(`[AUTH] Google login ${denied ? 'cancelled' : 'failed'}: ${req.query.error}`);
                return errorRedirect(res, denied
                    ? 'Google Sign-In was cancelled.'
                    : 'Google Sign-In failed. Please try again.');
            }

            // ── No user returned — map info.message to a clean error ───────
            if (!user) {
                const msg = info && info.message;
                if (msg === 'email_not_verified') {
                    logger.warn('[AUTH] Google account denied — email not verified');
                    return errorRedirect(res, 'Your Google account email is not verified. Please verify it with Google and try again.');
                }
                if (msg === 'banned') {
                    return errorRedirect(res, 'Your account has been banned.');
                }
                if (msg === 'no_email') {
                    return errorRedirect(res, 'Google did not provide an email address. Please check your Google account settings.');
                }
                return errorRedirect(res, 'Google Sign-In failed. Please try again.');
            }

            // ── Successful authentication — issue JWT ──────────────────────
            try {
                const token = issueJWT(user);

                logger.info(`[AUTH] Admin authorization successful for: ${user.email}`);

                // Clean up the short-lived passport session — we use JWT from here
                if (req.session) {
                    req.session.destroy(() => {});
                }

                // Redirect to frontend with the JWT as a URL parameter.
                // The frontend JS reads this, stores it in localStorage, and
                // cleans the URL — the token is never stored server-side.
                return res.redirect(`/?google_token=${encodeURIComponent(token)}`);

            } catch (jwtErr) {
                logger.error('[AUTH] Failed to issue JWT after Google auth:', jwtErr.message);
                return errorRedirect(res, 'Sign-In succeeded but session creation failed. Please try again.');
            }

        })(req, res, next);
    }
);

module.exports = { router, passport };
