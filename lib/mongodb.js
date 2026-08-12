/**
 * NovaX Bot — MongoDB Centralized Connection Handler
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { MongoClient } = require('mongodb');
const dns = require('dns');
const logger = require('./logger');

// Set DNS servers to resolve MongoDB SRV queries reliably on Windows
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    // Fallback silently if setServers is not supported in this environment
}

let client = null;
let db = null;
let isConnected = false;

/**
 * Connect to MongoDB Atlas / instance
 */
async function connectMongoDB() {
    if (isConnected && db) return db;

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'novaXmini';

    if (!uri) {
        logger.warn('[MongoDB] MONGODB_URI is not defined in environment variables.');
        return null;
    }

    try {
        client = new MongoClient(uri, {
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,   // Force IPv4 — fixes querySrv ECONNREFUSED on Windows
            tlsAllowInvalidCertificates: true // Bypass TLS certificate validation errors caused by time/clock drift
        });

        await client.connect();
        db = client.db(dbName);
        isConnected = true;

        logger.success(`[MongoDB] Connected successfully to database "${dbName}"`);

        // Create indexes safely
        await initIndexes();

        return db;
    } catch (err) {
        isConnected = false;
        logger.error(`[MongoDB] Connection failed: ${err.message}`);
        return null;
    }
}

/**
 * Ensure collection indexes exist
 */
async function initIndexes() {
    if (!db) return;
    try {
        await db.collection('settings').createIndex({ key: 1 }, { unique: true });
        await db.collection('user_languages').createIndex({ userId: 1 }, { unique: true });
        await db.collection('plugins').createIndex({ name: 1 }, { unique: true });
        await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
        await db.collection('bots').createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
        await db.collection('logs').createIndex({ timestamp: -1 });
        logger.info('[MongoDB] Collection indexes verified.');
    } catch (err) {
        logger.warn(`[MongoDB] Index initialization warning: ${err.message}`);
    }
}

/**
 * Get current database instance
 */
function getMongoDB() {
    return db;
}

/**
 * Get MongoDB health status for status endpoints / dashboard
 */
function getMongoStatus() {
    return {
        connected: isConnected && db !== null,
        database: process.env.MONGODB_DB_NAME || 'novaXmini'
    };
}

/**
 * Close MongoDB connection gracefully
 */
async function closeMongoDB() {
    if (client) {
        await client.close();
        isConnected = false;
        db = null;
        logger.info('[MongoDB] Connection closed.');
    }
}

module.exports = {
    connectMongoDB,
    getMongoDB,
    getMongoStatus,
    closeMongoDB
};
