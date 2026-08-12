/**
 * NovaX Bot — fakevCard.js
 * Fake vCard / contact message builder
 * Required by gc-setting.js and other group plugins
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

/**
 * Build a fake WhatsApp vCard contact string.
 * @param {string} name       Display name
 * @param {string} phone      Phone number (digits only, no +)
 * @param {string} [org]      Organisation / title line (optional)
 * @returns {string}          vCard 3.0 formatted string
 */
function fakevCard(name, phone, org = '') {
    const cleaned = phone.replace(/\D/g, '');
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name}`,
        `ORG:${org || name}`,
        `TEL;type=CELL;type=VOICE;waid=${cleaned}:+${cleaned}`,
        'END:VCARD',
    ];
    return lines.join('\n');
}

/**
 * Send a fake vCard contact via Baileys.
 * @param {object} conn       Baileys socket
 * @param {string} jid        Target JID
 * @param {object} mek        Quoted message
 * @param {string} name       Contact display name
 * @param {string} phone      Phone number
 * @param {string} [org]      Organisation
 */
async function sendFakevCard(conn, jid, mek, name, phone, org = '') {
    const vcard = fakevCard(name, phone, org);
    await conn.sendMessage(jid, {
        contacts: {
            displayName: name,
            contacts: [{ vcard }],
        },
    }, { quoted: mek });
}

module.exports = { fakevCard, sendFakevCard };
