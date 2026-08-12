const { cmd } = require('../NovaX_Mini');
const Jimp = require('jimp');
const fs = require('fs');

cmd({
    pattern: 'fullpp',
    alias: ['fullavatar', 'fullprofilepic'],
    desc: 'Set full-size bot profile picture without cropping (Owner only)',
    category: 'owner',
    react: '📸',
    use: '.fullpp',
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
                text: `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please reply to an image to set full profile picture!*\n╰━━━━━━━━━━━━━━━┈`,
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

        const media = await conn.downloadAndSaveMediaMessage(quoted, 'pp_full');
        
        // Load image using Jimp
        const image = await Jimp.read(media);
        const width = image.getWidth();
        const height = image.getHeight();
        const size = Math.max(width, height);
        
        // Create square image with white background
        const squareImage = new Jimp(size, size, 0xffffffff);
        // Center the original image in the square
        squareImage.composite(image, (size - width) / 2, (size - height) / 2);
        
        const buffer = await squareImage.getBufferAsync(Jimp.MIME_JPEG);
        
        await conn.updateProfilePicture(conn.user.id, buffer);
        
        if (fs.existsSync(media)) fs.unlinkSync(media);

        await conn.sendMessage(from, {
            text: `╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Full profile picture updated successfully!* 🖼️\n╰━━━━━━━━━━━━━━━┈`,
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
        console.error('FULLPP CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Set full profile picture failed!*\n┃ 🛠 *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
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
