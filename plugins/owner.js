const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const { sendInteractive, qr, url } = require('../lib/interactive');

cmd({
    pattern: 'owner',
    alias: ['ownerinfo', 'ownercontact'],
    desc: 'Get owner contact information',
    category: 'general',
    react: '👑',
    filename: __filename
}, async (conn,  mek,  m, { from, reply, myquoted, quoted, text }) => {
    try {
        const ownerNumber = (config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
        const prefix = config.PREFIX || '.';

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const vcard =
            `BEGIN:VCARD\nVERSION:3.0\nFN:👑 ɴᴏᴠᴀ_x ᴍɪɴɪ ᴏᴡɴᴇʀ\nORG:ɴᴏᴠᴀ_x ᴍɪɴɪ ᴏꜰꜰɪᴄɪᴀʟ;\nTEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\nEND:VCARD`;

        const body =
            `╭━━━〔 *👑 ɴᴏᴠᴀ_x ᴍɪɴɪ ᴏᴡɴᴇʀ* 〕━━━┈\n` +
            `┃ 👤 *Owner:* Dineth Sudarshana\n` +
            `┃ 🇱🇰 *Country:* Sri Lanka\n` +
            `┃ 📱 *Number:* +${ownerNumber}\n` +
            `┃ 🐙 *GitHub:* DINETHDEV\n` +
            `┃ 🤖 *Bot:* ɴᴏᴠᴀ_x ᴍɪɴɪ\n` +
            `╰━━━━━━━━━━━━━━━┈\n\n` +
            `Tap buttons below to connect 👇`;

        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body,
            footer: config.BOT_FOOTER,
            buttons: [
                ownerNumber ? url('💬 Contact Owner', `https://wa.me/${ownerNumber}`) : null,
                url('🐙 GitHub', 'https://github.com/DINETHDEV'),
                url('📢 Channel', config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A'),
                qr('📋 Menu', `${prefix}menu`)
            ].filter(Boolean)
        });

        // Send contact card
        await conn.sendMessage(from, {
            contacts: {
                displayName: '👑 Dineth Sudarshana',
                contacts: [{ vcard }]
            }
        }, { quoted: myquoted || mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('OWNER CMD ERROR:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error: ${e.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
