const { cmd } = require('../NovaX_Mini');
const { fakevCard } = require('../lib/fakevCard');
const config = require('../config');

// ════════════════════════════════════════════
//  🔄 RESTART COMMAND - Owner Only
// ════════════════════════════════════════════

cmd({
    pattern: 'restart',
    alias: ['reboot', 'rs'],
    desc: 'Restart the bot (Owner only)',
    category: 'owner',
    react: '🔄',
    use: '.restart',
    filename: __filename
},
async (conn,  mek,  m, { body, command, text, isOwner, reply }) => {
    const from = mek.key.remoteJid;
    try {
        // Owner check
        if (!isOwner) {
            return reply(
`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ ❌ *This command is for Owner only!*
┃ 👑 *Only the bot owner can restart.*
╰━━━━━━━━━━━━━━━┈`
            );
        }

        // React with loading
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

const { sendInteractive, qr, url } = require('../lib/interactive');

// ... (skipping import since we replace from line 32)
        // Send restart message
        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH || 'https://files.catbox.moe/aeg27n.png',
            body:
`╭━━━〔 *🔄 ʀᴇsᴛᴀʀᴛɪɴɢ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃
┃ 🔄 *Bot is restarting...*
┃ ⏳ *Please wait a few seconds.*
┃
┃ ✅ *Bot will be back shortly!*
╰━━━━━━━━━━━━━━━┈`,
            buttons: [
                qr('📋 MENU', `${config.PREFIX || '.'}menu`),
                qr('⚡ PING', `${config.PREFIX || '.'}ping`)
            ]
        });

        // React success
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // Wait 1.5 seconds then restart (exit code 1 to trigger process manager restart)
        setTimeout(() => {
            process.exit(1);
        }, 1500);

    } catch (err) {
        console.error('RESTART CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(
`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *Restart failed!*
┃ ${err.message}
╰━━━━━━━━━━━━━━━┈`
        );
    }
});
