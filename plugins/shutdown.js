const { cmd } = require('../NovaX_Mini');
const config = require('../config');

cmd({
    pattern: 'shutdown',
    alias: ['stop', 'off', 'poweroff'],
    desc: 'Shutdown the bot (Owner only)',
    category: 'owner',
    react: '🛑',
    use: '.shutdown',
    filename: __filename
},
async (conn,  mek,  m, { quoted, body, command, text, isOwner }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isOwner) {
            return conn.sendMessage(from, {
                text: `╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *This command is for Owner only!*\n┃ 👑 *Only the bot owner can shutdown the bot.*\n╰━━━━━━━━━━━━━━━┈`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363429597718924@newsletter',
                        newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

const { sendInteractive, qr, url } = require('../lib/interactive');

// ... (skipping import logic)
        const imgUrl = (config.IMAGE_PATH && String(config.IMAGE_PATH).startsWith('http'))
            ? config.IMAGE_PATH
            : 'https://files.catbox.moe/aeg27n.png';

        await sendInteractive(conn, from, mek, {
            imageUrl: imgUrl,
            body: `╭━━━〔 *🛑 sʜᴜᴛᴛɪɴɢ ᴅᴏᴡɴ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃\n┃ 🛑 *Bot is shutting down...*\n┃ 💤 *Bot will stay offline until manually started.*\n┃\n╰━━━━━━━━━━━━━━━┈`,
            buttons: [
                qr('📋 MENU', `${config.PREFIX || '.'}menu`),
                qr('⚡ PING', `${config.PREFIX || '.'}ping`)
            ]
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        setTimeout(() => {
            process.exit(0);
        }, 1500);

    } catch (err) {
        console.error('SHUTDOWN CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Shutdown failed!*\n┃ 🛠 *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });
    }
});
