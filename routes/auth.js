/**
 * Authentication Routes (MongoDB)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../database/models');
const { authLimiter } = require('../middleware/rateLimiter');
const { sendWelcomeEmail } = require('../services/emailService');
const config = require('../config');

const router = express.Router();

// Register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phoneNumber } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Check if user exists
        const existingEmail = await User.findOne({ email });
        const existingUsername = await User.findOne({ username });

        if (existingEmail || existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create user
        const emailVerificationToken = uuidv4();
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            emailVerificationToken
        });

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.firstName, emailVerificationToken);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin,
                    emailVerified: user.emailVerified
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Account is banned'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin,
                    emailVerified: user.emailVerified,
                    theme: user.theme
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        await user.update({
            emailVerified: true,
            emailVerificationToken: null
        });

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed'
        });
    }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        }

        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires
        });

        res.json({
            success: true,
            message: 'If the email exists, a reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request'
        });
    }
});

// Get current user (token verification)
const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    isAdmin: req.user.isAdmin,
                    emailVerified: req.user.emailVerified,
                    theme: req.user.theme,
                    avatar: req.user.avatar,
                    phoneNumber: req.user.phoneNumber
                }
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

module.exports = router;