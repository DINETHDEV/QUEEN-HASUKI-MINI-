/**
 * User Model — MongoDB Adapter
 * Copyright © 2025 DarkSide Developers & Zero Bug Zone
 */

'use strict';

const { getMongoDB } = require('../../lib/mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function getCollection() {
    const db = getMongoDB();
    return db ? db.collection('users') : null;
}

class UserDoc {
    constructor(data) {
        Object.assign(this, data);
        if (this._id && !this.id) {
            this.id = this._id.toString();
        }
    }

    async comparePassword(candidatePassword) {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    }

    getFullName() {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }

    async update(updateFields) {
        const col = getCollection();
        if (!col) return this;

        if (updateFields.password) {
            updateFields.password = await bcrypt.hash(updateFields.password, 12);
        }

        updateFields.updatedAt = new Date();
        const query = this.id ? { id: this.id } : { _id: this._id };
        await col.updateOne(query, { $set: updateFields });

        Object.assign(this, updateFields);
        return this;
    }
}

const User = {
    async create(data) {
        const col = getCollection();
        if (!col) throw new Error('MongoDB is not connected');

        const now = new Date();
        const doc = {
            id: data.id || uuidv4(),
            username: data.username,
            email: data.email,
            password: data.password ? await bcrypt.hash(data.password, 12) : null,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phoneNumber: data.phoneNumber || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            isBanned: data.isBanned !== undefined ? data.isBanned : false,
            isAdmin: data.isAdmin !== undefined ? data.isAdmin : false,
            emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
            emailVerificationToken: data.emailVerificationToken || null,
            resetPasswordToken: data.resetPasswordToken || null,
            resetPasswordExpires: data.resetPasswordExpires || null,
            lastLogin: data.lastLogin || null,
            theme: data.theme || 'dark',
            avatar: data.avatar || null,
            // ── Google OAuth fields ────────────────────────────────────────
            googleId:     data.googleId     || null,
            authProvider: data.authProvider || 'local',  // 'local' | 'google' | 'both'
            createdAt: now,
            updatedAt: now,
        };

        await col.insertOne(doc);
        return new UserDoc(doc);
    },

    async findOne(query = {}) {
        const col = getCollection();
        if (!col) return null;

        let filter = {};
        if (query.where) {
            filter = translateQuery(query.where);
        } else {
            filter = query;
        }

        const doc = await col.findOne(filter);
        return doc ? new UserDoc(doc) : null;
    },

    async findByPk(id) {
        return this.findOne({ id });
    },

    async findById(id) {
        return this.findOne({ id });
    },

    async count(query = {}) {
        const col = getCollection();
        if (!col) return 0;
        const filter = query.where ? translateQuery(query.where) : query;
        return await col.countDocuments(filter);
    },

    async findAll(query = {}) {
        const col = getCollection();
        if (!col) return [];

        const filter = query.where ? translateQuery(query.where) : {};
        let cursor = col.find(filter);

        if (query.order) {
            const sort = {};
            query.order.forEach(([col, dir]) => { sort[col] = dir.toUpperCase() === 'DESC' ? -1 : 1; });
            cursor = cursor.sort(sort);
        }

        if (query.limit) cursor = cursor.limit(parseInt(query.limit));
        if (query.offset) cursor = cursor.skip(parseInt(query.offset));

        const docs = await cursor.toArray();
        return docs.map(d => new UserDoc(d));
    },

    async findAndCountAll(query = {}) {
        const count = await this.count(query);
        const rows = await this.findAll(query);
        return { count, rows };
    },

    /**
     * Find a user by their Google OAuth sub ID.
     * @param {string} googleId - The Google `sub` value from the ID token.
     */
    async findByGoogleId(googleId) {
        return this.findOne({ googleId });
    }
};

/**
 * Translate simple query objects (handling basic Sequelize Op conversions if needed)
 */
function translateQuery(where) {
    if (!where) return {};
    const mongoQuery = {};

    for (const [key, val] of Object.entries(where)) {
        if (key === 'id' || key === 'email' || key === 'username' || key === 'isBanned' || key === 'isAdmin') {
            mongoQuery[key] = val;
        } else if (typeof key === 'symbol' || key === 'Symbol(or)' || key.includes('or')) {
            // Support basic OR
            if (Array.isArray(val)) {
                mongoQuery.$or = val.map(item => translateQuery(item));
            }
        } else {
            mongoQuery[key] = val;
        }
    }
    return mongoQuery;
}

module.exports = User;