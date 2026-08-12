/**
 * Settings Collection Adapter (MongoDB)
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { getMongoDB } = require('../../lib/mongodb');

function getCollection() {
    const db = getMongoDB();
    return db ? db.collection('settings') : null;
}

module.exports = {
    getCollection,
    async findOne(query) {
        const col = getCollection();
        if (!col) return null;
        const filter = query.where ? query.where : query;
        return await col.findOne(filter);
    },
    async findAll() {
        const col = getCollection();
        if (!col) return [];
        return await col.find({}).toArray();
    }
};
