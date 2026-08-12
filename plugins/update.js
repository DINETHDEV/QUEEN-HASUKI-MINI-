const { cmd } = require('../NovaX_Mini');
const { exec } = require('child_process');
const config = require('../config');

cmd({
    pattern: 'update',
    alias: ['gitupdate', 'up'],
    desc: 'Update the bot from Git repository (Owner only)',
    category: 'owner',
    react: '📥',
    use: '.update',
    filename: __filename
},
async (conn,  mek,  m, { quoted, command, text, isOwner }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isOwner) {
            return conn.sendMessage(from, {
                text: `╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ *This command is for Owner only!*\n╰━━━━━━━━━━━━━━━┈`,
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

        exec('git pull', async (err, stdout, stderr) => {
            if (err) {
                return conn.sendMessage(from, {
                    text: `╭━━━〔 *❌ ᴜᴘᴅᴀᴛᴇ ꜰᴀɪʟᴇᴅ* 〕━━━┈\n┃ 🛠 *Error during git pull:*\n┃ ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
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

            let msg = `╭━━━〔 *📥 ɴᴏᴠᴀ_x ᴜᴘᴅᴀᴛᴇ* 〕━━━┈\n┃\n`;
            if (stdout.includes('Already up to date.')) {
                msg += `┃ ✅ *Bot is already up to date!*`;
            } else {
                msg += `┃ ✅ *Update completed successfully!*\n┃\n┃ *Git log:*\n┃ ${stdout.substring(0, 300)}`;
            }
            msg += `\n╰━━━━━━━━━━━━━━━┈\n> © 𝘕𝘰𝙫𝘢𝘟_𝘔𝘪𝘯𝘪`;

            await conn.sendMessage(from, {
                text: msg,
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

            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

            if (!stdout.includes('Already up to date.')) {
                // Restart after update
                setTimeout(() => {
                    process.exit(0);
                }, 2000);
            }
        });

    } catch (err) {
        console.error('UPDATE CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Update failed!*\n┃ 🛠 *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
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
