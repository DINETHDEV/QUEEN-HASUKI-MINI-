const fs = require('fs');
const config = require('../config');
const path = require('path');
const { cmd } = require('../NovaX_Mini');
let Session;
try {
    const db = require('../lib/database');
    Session = db.Session;
} catch (e) {
    console.error("Database import failed in users plugin:", e.message);
}

cmd({
    pattern: 'users',
    alias: ['userstats'],
    desc: 'Show paired users',
    category: 'owner',
    react: '👥',
    use: '.users',

    
    filename: __filename
},
async (conn,  mek,  m, { isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isOwner) {
            return reply('❌ Owner Only!');
        }

        let totalUsers = 0;

        // Try getting the count from MongoDB first
        if (Session) {
            try {
                totalUsers = await Session.countDocuments();
            } catch (err) {
                console.error("Error counting sessions from MongoDB:", err);
            }
        }

        // If count is still 0 (or DB query failed/was empty), check local session folder
        if (totalUsers === 0) {
            const sessionPath = path.join(__dirname, '../session');
            if (fs.existsSync(sessionPath)) {
                const files = fs.readdirSync(sessionPath);
                // Count local session folders (which start with 'session_')
                const users = files.filter(file => file.startsWith('session_'));
                totalUsers = users.length;
            }
        }

        await reply(
`╭━━━〔 *👥 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃
┃ 👤 *Total Paired Users :* ${totalUsers}
┃
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`
        );

    } catch (err) {
        console.error(err);
        reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
