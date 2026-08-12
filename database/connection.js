/**
 * Database Connection Handler (MongoDB Atlas)
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const { connectMongoDB, getMongoStatus, closeMongoDB } = require('../lib/mongodb');
const logger = require('../lib/logger');

const connectDatabase = async () => {
    try {
        const db = await connectMongoDB();
        if (db) {
            logger.success('✅ Database connection established successfully.');
            return true;
        } else {
            logger.warn('⚠️ MongoDB connection could not be established. Operating in fallback mode.');
            return false;
        }
    } catch (error) {
        logger.error('❌ Unable to connect to the database:', error.message);
        return false;
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\n🔄 Gracefully shutting down database connection...');
    await closeMongoDB();
    process.exit(0);
});

module.exports = { connectDatabase, getMongoStatus };
