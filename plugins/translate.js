const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const fetch = require('node-fetch');
const { sendInteractive, qr, url } = require('../lib/interactive');

cmd({
    pattern: 'translate',
    alias: ['trt', 'tr'],
    react: '🌐',
    desc: 'Translate text to any language',
    category: 'tools',
    use: '.translate <text> <lang> | reply to msg: .translate <lang>',
    filename: __filename
}, async (conn,  mek,  m, { body, args, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || '.';

        let textToTranslate = '';
        let lang = '';

        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quotedMessage) {
            textToTranslate =
                quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.imageMessage?.caption ||
                quotedMessage.videoMessage?.caption ||
                '';
            lang = (args[0] || '').trim();
        } else {
            if (!q || args.length < 2) {
                return sendInteractive(conn, from, mek, {
                    imageUrl: config.IMAGE_PATH,
                    body:
                        `╭━━━〔 *🌐 ᴛʀᴀɴsʟᴀᴛᴇ* 〕━━━┈\n` +
                        `┃ *Usage:*\n` +
                        `┃ 1️⃣ Reply to a msg: *.translate <lang>*\n` +
                        `┃ 2️⃣ Direct: *.translate <text> <lang>*\n` +
                        `┃\n` +
                        `┃ *Example:*\n` +
                        `┃ .translate hello si\n` +
                        `┃ .translate hello fr\n` +
                        `╰━━━━━━━━━━━━━━━┈`,
                    footer: config.BOT_FOOTER,
                    buttons: [qr('📋 Menu', `${prefix}menu`)]
                });
            }
            lang = args[args.length - 1].trim();
            textToTranslate = args.slice(0, -1).join(' ');
        }

        if (!textToTranslate) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *⚠️ Error* 〕━━━┈\n┃ ❌ *No text found to translate!*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        if (!lang) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *⚠️ Error* 〕━━━┈\n┃ ❌ *Please provide a language code!*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        let translatedText = null;

        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]?.[0]?.[0]) translatedText = data[0][0][0];
            }
        } catch (e) {}

        if (!translatedText) {
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.responseData?.translatedText) translatedText = data.responseData.translatedText;
                }
            } catch (e) {}
        }

        if (!translatedText) {
            try {
                const res = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.translated) translatedText = data.translated;
                }
            } catch (e) {}
        }

        if (!translatedText) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ Error* 〕━━━┈\n┃ *Translation failed!*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('🔄 Retry', `${prefix}translate ${q}`), qr('📋 Menu', `${prefix}menu`)]
            });
        }

        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body:
                `╭━━━〔 *🌐 ᴛʀᴀɴsʟᴀᴛᴇ* 〕━━━┈\n` +
                `┃ 📝 *Original:*\n` +
                `┃ ${textToTranslate}\n` +
                `┃\n` +
                `┃ 🌐 *Translated (${lang.toUpperCase()}):*\n` +
                `┃ ${translatedText}\n` +
                `╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [
                qr('📋 Menu', `${prefix}menu`),
                qr('⚡ Ping', `${prefix}ping`)
            ]
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[TRANSLATE ERROR]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`╭━━━〔 *❌ Error* 〕━━━┈\n┃ *Translation failed!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
