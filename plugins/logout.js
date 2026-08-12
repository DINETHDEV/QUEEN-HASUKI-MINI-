const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const {
    deleteSessionFromMongoDB,
    removeNumberFromMongoDB
} = require('../lib/database');
const fs = require('fs-extra');
const path = require('path');

cmd(
{
    pattern: "logout",
    alias: ["clearsession", "unlink"],
    desc: "Logout bot and clear session from MongoDB + local storage",
    category: "owner",
    react: "🔴",
    fromMe: true,
    filename: __filename
},
async (conn,  mek,  m, { command, botNumber, isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {

        if (!isOwner) {
            return reply(
`╭══════════════════════⊷
┃ 🔒 *ACCESS DENIED*
┣══════════════════════⊷
┃ This command is owner only.
╰══════════════════════⊷`
            );
        }

        await reply(
`╭══════════════════════⊷
┃ 🔴 *LOGOUT*
┣══════════════════════⊷
┃ ⏳ Session clear කරනවා...
┃ MongoDB + Local files delete වෙනවා.
╰══════════════════════⊷`
        );

        // Get bot number (clean digits only)
        const sanitizedNumber = (botNumber || '').replace(/[^0-9]/g, '');

        // Delete local session folder
        const isVercel = process.env.VERCEL === '1';
        const sessionPath = isVercel
            ? path.join('/tmp', `session_${sanitizedNumber}`)
            : path.join(__dirname, '..', 'session', `session_${sanitizedNumber}`);

        if (fs.existsSync(sessionPath)) {
            await fs.remove(sessionPath);
        }

        // Delete from MongoDB
        if (sanitizedNumber) {
            await deleteSessionFromMongoDB(sanitizedNumber);
            await removeNumberFromMongoDB(sanitizedNumber);
        }

        // Logout from WhatsApp (this will trigger 401 → connection.update handler)
        await conn.logout();

    } catch (e) {
        console.log("LOGOUT CMD ERROR:", e);
        reply(
`╭══════════════════════⊷
┃ ❌ *ERROR*
┣══════════════════════⊷
┃ ${e.message}
╰══════════════════════⊷`
        );
    }
});
