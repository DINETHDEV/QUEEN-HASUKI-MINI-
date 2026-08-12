/**
 * Bot Model — MongoDB Adapter
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const { getMongoDB } = require('../../lib/mongodb');
const { v4: uuidv4 } = require('uuid');

function getCollection() {
    const db = getMongoDB();
    return db ? db.collection('bots') : null;
}

class BotDoc {
    constructor(data) {
        Object.assign(this, data);
        if (this._id && !this.id) {
            this.id = this._id.toString();
        }
    }

    async update(updateFields) {
        const col = getCollection();
        if (!col) return this;

        updateFields.updatedAt = new Date();
        const query = this.id ? { id: this.id } : { _id: this._id };
        await col.updateOne(query, { $set: updateFields });

        Object.assign(this, updateFields);
        return this;
    }

    async destroy() {
        const col = getCollection();
        if (!col) return;
        const query = this.id ? { id: this.id } : { _id: this._id };
        await col.deleteOne(query);
    }

    toJSON() {
        const copy = { ...this };
        delete copy._id;
        return copy;
    }
}

const Bot = {
    async create(data) {
        const col = getCollection();
        if (!col) throw new Error('MongoDB is not connected');

        const now = new Date();
        const doc = {
            id: data.id || uuidv4(),
            userId: data.userId,
            phoneNumber: data.phoneNumber,
            botName: data.botName || 'NovaX Mini',
            status: data.status || 'disconnected',
            isActive: data.isActive !== undefined ? data.isActive : true,
            sessionData: data.sessionData || null,
            qrCode: data.qrCode || null,
            pairingCode: data.pairingCode || null,
            lastSeen: data.lastSeen || null,
            settings: data.settings || {
                autoViewStatus: true,
                autoLikeStatus: true,
                autoRecording: true,
                prefix: '.',
                autoReact: false,
                antiCall: true,
                antiDelete: true
            },
            statistics: data.statistics || {
                messagesReceived: 0,
                messagesSent: 0,
                commandsExecuted: 0,
                uptime: 0
            },
            createdAt: now,
            updatedAt: now,
        };

        await col.insertOne(doc);
        return new BotDoc(doc);
    },

    async findOne(query = {}) {
        const col = getCollection();
        if (!col) return null;

        const filter = query.where ? query.where : query;
        const doc = await col.findOne(filter);
        return doc ? new BotDoc(doc) : null;
    },

    async findByPk(id) {
        return this.findOne({ id });
    },

    async count(query = {}) {
        const col = getCollection();
        if (!col) return 0;
        const filter = query.where ? query.where : query;
        return await col.countDocuments(filter);
    },

    async findAll(query = {}) {
        const col = getCollection();
        if (!col) return [];

        const filter = query.where ? query.where : {};
        let cursor = col.find(filter);

        if (query.order) {
            const sort = {};
            query.order.forEach(([c, dir]) => { sort[c] = dir.toUpperCase() === 'DESC' ? -1 : 1; });
            cursor = cursor.sort(sort);
        }

        if (query.limit) cursor = cursor.limit(parseInt(query.limit));
        if (query.offset) cursor = cursor.skip(parseInt(query.offset));

        const docs = await cursor.toArray();

        // Handle user join if requested
        if (query.include) {
            const User = require('./User');
            for (const doc of docs) {
                if (doc.userId) {
                    doc.user = await User.findById(doc.userId);
                }
            }
        }

        return docs.map(d => new BotDoc(d));
    },

    async findAndCountAll(query = {}) {
        const count = await this.count(query);
        const rows = await this.findAll(query);
        return { count, rows };
    },

    async update(updateFields, options = {}) {
        const col = getCollection();
        if (!col) return;
        const filter = options.where ? options.where : {};
        updateFields.updatedAt = new Date();
        await col.updateMany(filter, { $set: updateFields });
    }
};

module.exports = Bot;