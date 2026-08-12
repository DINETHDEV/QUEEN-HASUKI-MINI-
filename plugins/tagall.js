const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const { sendInteractive, qr, select } = require('../lib/interactive');

cmd({
    pattern: 'tagall',
    alias: ['mentionall'],
    desc: 'Tag all group members',
    category: 'group',
    react: '🔊',
    filename: __filename
}, async (conn,  mek,  m, { quoted, body, command, q, isGroup, isOwner, participants, isAdmins, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || '.';

        if (!isGroup) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ Group Only* 〕━━━┈\n┃ *This command works in groups only.*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }
        if (!isAdmins && !isOwner) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ Admins Only* 〕━━━┈\n┃ *Only group admins can use tagall.*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        const message = q || '📢 Attention Everyone!';
        const mentions = participants.map(p => p.id);

        let text =
            `╭━━━〔 *📢 ɴᴏᴠᴀ_x ᴍɪɴɪ — Tag All* 〕━━━┈\n` +
            `┃ 📝 *${message}*\n` +
            `┃ 👥 *Members:* ${participants.length}\n` +
            `╰━━━━━━━━━━━━━━━┈\n\n`;

        participants.forEach((member, i) => {
            text += `${i + 1}. @${member.id.split('@')[0]}\n`;
        });
        text += `\n> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            text,
            mentions,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: myquoted || mek });

        // Send group action buttons after tagall
        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body:
                `╭━━━〔 *👥 Group Actions* 〕━━━┈\n` +
                `┃ ✅ Tagged *${participants.length}* members\n` +
                `┃ Use buttons below for more actions:\n` +
                `╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [
                qr('🔊 Tag Again', `${prefix}tagall ${message}`),
                qr('🔇 Mute Group', `${prefix}mute`),
                qr('📊 Group Info', `${prefix}groupinfo`),
                qr('📋 Menu', `${prefix}menu`)
            ]
        });

    } catch (e) {
        console.error('TAGALL ERROR:', e);
        reply(`╭━━━〔 *❌ Error* 〕━━━┈\n┃ ${e.message}\n╰━━━━━━━━━━━━━━━┈`);
    }
});
