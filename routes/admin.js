/**
 * Admin Routes (MongoDB)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const express = require('express');
const { User, Bot } = require('../database/models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalBots = await Bot.count();
        const activeBots = await Bot.count({ where: { status: 'connected' } });
        const bannedUsers = await User.count({ where: { isBanned: true } });

        const recentUsers = await User.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        const recentBots = await Bot.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: true
        });

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalBots,
                    activeBots,
                    bannedUsers
                },
                recentUsers,
                recentBots
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Ban/Unban user
router.put('/users/:userId/ban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { banned } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Cannot ban admin users'
            });
        }

        await user.update({ isBanned: banned });

        // Disconnect all user's bots if banned
        if (banned) {
            await Bot.update(
                { status: 'disconnected' },
                { where: { userId } }
            );
        }

        res.json({
            success: true,
            message: `User ${banned ? 'banned' : 'unbanned'} successfully`
        });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

// Get all bots
router.get('/bots', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = status ? { status } : {};

        const { count, rows: bots } = await Bot.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: true
        });

        res.json({
            success: true,
            data: {
                bots,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get bots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bots'
        });
    }
});

// Force disconnect bot
router.put('/bots/:botId/disconnect', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { botId } = req.params;

        const bot = await Bot.findByPk(botId);
        if (!bot) {
            return res.status(404).json({
                success: false,
                message: 'Bot not found'
            });
        }

        await bot.update({ status: 'disconnected' });

        if (global.io) {
            global.io.to(`user_${bot.userId}`).emit('bot_status_update', {
                botId: bot.id,
                status: 'disconnected'
            });
        }

        res.json({
            success: true,
            message: 'Bot disconnected successfully'
        });
    } catch (error) {
        console.error('Disconnect bot error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect bot'
        });
    }
});

// Delete bot (admin)
router.delete('/bots/:botId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { botId } = req.params;

        const bot = await Bot.findByPk(botId);
        if (!bot) {
            return res.status(404).json({
                success: false,
                message: 'Bot not found'
            });
        }

        await bot.destroy();

        res.json({
            success: true,
            message: 'Bot deleted successfully'
        });
    } catch (error) {
        console.error('Delete bot error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bot'
        });
    }
});

module.exports = router;