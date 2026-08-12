/**
 * NovaX Bot — MongoDB Migration Script
 * Migrates data from SQLite / PostgreSQL to MongoDB Atlas.
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const dns = require('dns');

// Set DNS servers to resolve MongoDB SRV queries reliably on Windows
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    // Fallback silently if setServers is not supported
}

async function runMigration() {
    console.log('\n========================================');
    console.log('       NovaX MongoDB Migration');
    console.log('========================================\n');

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'novaXmini';

    if (!uri) {
        console.error('❌ MONGODB_URI is not set in environment (.env). Please set it first.');
        process.exit(1);
    }

    console.log(`📡 Connecting to MongoDB database "${dbName}"...`);
    let client;
    let db;
    try {
        client = new MongoClient(uri, {
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            tlsAllowInvalidCertificates: true
        });
        await client.connect();
        db = client.db(dbName);
        console.log('✅ Connected to MongoDB Atlas.\n');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }

    // Ensure unique indexes
    await db.collection('settings').createIndex({ key: 1 }, { unique: true });
    await db.collection('user_languages').createIndex({ userId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('bots').createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });

    let settingsStats = { found: 0, migrated: 0, failed: 0 };
    let userLangStats = { found: 0, migrated: 0, failed: 0 };
    let usersStats = { found: 0, migrated: 0, failed: 0 };
    let botsStats = { found: 0, migrated: 0, failed: 0 };

    const sqlitePath = path.join(__dirname, '..', 'database', 'models', 'hasuki.db');
    if (fs.existsSync(sqlitePath)) {
        console.log(`📂 Found SQLite database at ${sqlitePath}. Inspecting records...`);
        try {
            const sqlite3 = require('sqlite3').verbose();
            const sqliteDb = new sqlite3.Database(sqlitePath);

            const queryAll = (sql) => new Promise((res, rej) => {
                sqliteDb.all(sql, [], (err, rows) => err ? rej(err) : res(rows || []));
            });

            // Migrate Settings
            try {
                const settingsRows = await queryAll("SELECT * FROM settings");
                settingsStats.found = settingsRows.length;
                for (const row of settingsRows) {
                    try {
                        let parsedVal = row.value;
                        try { parsedVal = JSON.parse(row.value); } catch (_) {}
                        await db.collection('settings').updateOne(
                            { key: row.key },
                            { $set: { key: row.key, value: parsedVal, updatedAt: new Date() } },
                            { upsert: true }
                        );
                        settingsStats.migrated++;
                    } catch (e) {
                        settingsStats.failed++;
                    }
                }
            } catch (_) {}

            // Migrate User Languages
            try {
                const langRows = await queryAll("SELECT * FROM user_lang");
                userLangStats.found = langRows.length;
                for (const row of langRows) {
                    try {
                        await db.collection('user_languages').updateOne(
                            { userId: row.jid },
                            { $set: { userId: row.jid, language: row.language, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
                            { upsert: true }
                        );
                        userLangStats.migrated++;
                    } catch (e) {
                        userLangStats.failed++;
                    }
                }
            } catch (_) {}

            // Migrate Users
            try {
                const userRows = await queryAll("SELECT * FROM Users");
                usersStats.found = userRows.length;
                for (const row of userRows) {
                    try {
                        delete row._id;
                        await db.collection('users').updateOne(
                            { email: row.email },
                            { $set: row },
                            { upsert: true }
                        );
                        usersStats.migrated++;
                    } catch (e) {
                        usersStats.failed++;
                    }
                }
            } catch (_) {}

            // Migrate Bots
            try {
                const botRows = await queryAll("SELECT * FROM Bots");
                botsStats.found = botRows.length;
                for (const row of botRows) {
                    try {
                        delete row._id;
                        await db.collection('bots').updateOne(
                            { phoneNumber: row.phoneNumber },
                            { $set: row },
                            { upsert: true }
                        );
                        botsStats.migrated++;
                    } catch (e) {
                        botsStats.failed++;
                    }
                }
            } catch (_) {}

            sqliteDb.close();
        } catch (err) {
            console.warn('⚠️ SQLite read warning:', err.message);
        }
    } else {
        console.log('ℹ️ No SQLite database file found. Initializing MongoDB collections directly...');
    }

    // Default Bot Settings if none exist
    const defaultSettings = [
        { key: 'bot_name', value: process.env.BOT_NAME || 'NovaX Mini' },
        { key: 'prefix', value: process.env.PREFIX || '.' },
        { key: 'owner_name', value: process.env.OWNER_NAME || 'Dineth Sudarshana' },
        { key: 'language', value: process.env.LANGUAGE || 'en' },
        { key: 'footer', value: process.env.BOT_FOOTER || '© 2025 Zero Bug Zone' },
        { key: 'image_path', value: process.env.IMAGE_PATH || 'https://files.catbox.moe/aeg27n.png' },
        { key: 'channel_link', value: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A' },
        { key: 'pack_name', value: process.env.PACK_NAME || 'NovaX Mini' },
        { key: 'pack_author', value: process.env.PACK_AUTHOR || 'ZeroBugZone' },
        { key: 'auto_read', value: true },
        { key: 'auto_typing', value: false },
        { key: 'auto_recording', value: true },
        { key: 'interactive_buttons', value: true },
    ];

    for (const item of defaultSettings) {
        await db.collection('settings').updateOne(
            { key: item.key },
            { $setOnInsert: { key: item.key, value: item.value, updatedAt: new Date() } },
            { upsert: true }
        );
    }

    console.log('----------------------------------------');
    console.log('  MongoDB Migration Summary');
    console.log('----------------------------------------');
    console.log(`Settings:       Found: ${settingsStats.found} | Migrated: ${settingsStats.migrated} | Failed: ${settingsStats.failed}`);
    console.log(`User Languages: Found: ${userLangStats.found} | Migrated: ${userLangStats.migrated} | Failed: ${userLangStats.failed}`);
    console.log(`Users:          Found: ${usersStats.found} | Migrated: ${usersStats.migrated} | Failed: ${usersStats.failed}`);
    console.log(`Bots:           Found: ${botsStats.found} | Migrated: ${botsStats.migrated} | Failed: ${botsStats.failed}`);
    console.log('----------------------------------------');
    console.log('🎉 Migration completed successfully!\n');

    await client.close();
}

runMigration().catch(err => {
    console.error('❌ Migration Error:', err);
    process.exit(1);
});
