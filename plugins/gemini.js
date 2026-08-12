const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url, errMsg } = require('../lib/interactive');

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', text) }, { quoted: mek });

cmd({
    pattern: 'gemini',
    alias: ['ai', 'chat', 'bot'],
    react: '🤖',
    desc: 'Chat with Gemini AI',
    category: 'general',
    use: '.gemini <message>',
    filename: __filename
}, async (conn,  mek,  m, { q, reply, from, text }) => {
    const _from = from || mek.key.remoteJid;
    try {
        if (!q) {
            return sendInteractive(conn, _from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ ᴀɪ* 〕━━━┈\n┃ *Usage:* .gemini <message>\n┃ *Example:* .gemini Hello, who are you?\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${config.PREFIX || '.'}menu`)]
            });
        }

        await conn.sendMessage(_from, { react: { text: '💬', key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/gemini?query=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });

        if (!res.data.status || !res.data.results) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *AI is currently unavailable!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const answer = res.data.results;
        const prefix = config.PREFIX || '.';

        const body =
            `╭━━━〔 *🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ ᴀɪ* 〕━━━┈\n` +
            `┃ 💬 *You:* ${q.substring(0, 60)}${q.length > 60 ? '...' : ''}\n` +
            `╰━━━━━━━━━━━━━━━┈\n\n` +
            `${answer}`;

        await sendInteractive(conn, _from, mek, {
            imageUrl: config.IMAGE_PATH,
            body,
            footer: config.BOT_FOOTER,
            buttons: [
                qr('🔄 Regenerate', `${prefix}gemini ${q}`),
                qr('📋 Menu', `${prefix}menu`),
                qr('⚡ Ping', `${prefix}ping`)
            ]
        });

        await conn.sendMessage(_from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('GEMINI ERROR:', err.message);
        reply(errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', 'Error connecting to Gemini AI!'));
    }
});
