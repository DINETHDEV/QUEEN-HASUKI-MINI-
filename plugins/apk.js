const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url } = require('../lib/interactive');

// Map to store APK search results
const apkCache = new Map();

cmd({
    pattern: 'apk',
    alias: ['app', 'playstore', 'application'],
    react: '📦',
    desc: 'Download APK via Aptoide',
    category: 'download',
    use: '.apk <name>',
    filename: __filename
}, async (conn,  mek,  m, { q, text }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || '.';

        if (!q) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *📦 APK Downloader* 〕━━━┈\n┃ *Usage:* .apk <name>\n┃ *Example:* .apk WhatsApp\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=1`;
        const { data } = await axios.get(apiUrl);

        if (!data?.datalist?.list?.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *APK not found!*\n┃ Try a different app name.\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('🔄 Retry', `${prefix}apk ${q}`), qr('📋 Menu', `${prefix}menu`)]
            });
        }

        const app = data.datalist.list[0];
        const appSize = (app.size / 1048576).toFixed(2);
        
        // Cache the result for download
        apkCache.set(app.package, app);
        setTimeout(() => apkCache.delete(app.package), 10 * 60 * 1000);

        const body =
            `╭━━━〔 *📦 ɴᴏᴠᴀ_x ᴍɪɴɪ — APK* 〕━━━┈\n` +
            `┃ 📱 *Name:* ${app.name}\n` +
            `┃ 📦 *Size:* ${appSize} MB\n` +
            `┃ 🔖 *Package:* ${app.package}\n` +
            `┃ 🔢 *Version:* ${app.file.vername}\n` +
            `╰━━━━━━━━━━━━━━━┈\n\n` +
            `Tap the button below to download 👇`;

        await sendInteractive(conn, from, mek, {
            imageUrl: app.icon || config.IMAGE_PATH,
            body,
            footer: config.BOT_FOOTER,
            buttons: [
                qr('⬇️ Download APK', `${prefix}apkdl ${app.package}`),
                url('🔗 Aptoide', app.store.url || 'https://en.aptoide.com/'),
                qr('📋 Menu', `${prefix}menu`)
            ]
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('APK SEARCH ERROR:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        const prefix = config.PREFIX || '.';
        sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body: `╭━━━〔 *❌ Error* 〕━━━┈\n┃ *APK search failed!*\n╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }
});

// Download handler for APK
cmd({
    pattern: 'apkdl',
    dontAddCommandList: true,
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return;
        
        const app = apkCache.get(q);
        if (!app) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Download session expired! Please search again.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        await conn.sendMessage(from, {
            document: { url: app.file.path || app.file.path_alt },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${app.name}.apk`,
            caption: `╭━━━〔 *📦 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 📱 *${app.name}*\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('APK DOWNLOAD ERROR:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`╭━━━〔 *❌ Error* 〕━━━┈\n┃ *Download failed!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
