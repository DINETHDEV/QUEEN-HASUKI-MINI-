const { cmd } = require('../NovaX_Mini');
const fs = require('fs');

cmd({
    pattern: 'setpp',
    alias: ['setavatar', 'setprofilepic'],
    desc: 'Set bot profile picture (Owner only)',
    category: 'owner',
    react: '📸',
    use: '.setpp',
    filename: __filename
},
async (conn,  mek,  m, { command, text, isOwner, reply }) => {
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

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        if (!/image/.test(mime)) {
            return conn.sendMessage(from, {
                text: `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please reply to an image to set profile picture!*\n╰━━━━━━━━━━━━━━━┈`,
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

        const media = await conn.downloadAndSaveMediaMessage(quoted, 'pp');
        await conn.updateProfilePicture(conn.user.id, { url: media });
        
        if (fs.existsSync(media)) fs.unlinkSync(media);

        await conn.sendMessage(from, {
            text: `╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Profile picture updated successfully!* ✨\n╰━━━━━━━━━━━━━━━┈`,
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

    } catch (err) {
        console.error('SETPP CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Set profile picture failed!*\n┃ 🛠 *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
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
