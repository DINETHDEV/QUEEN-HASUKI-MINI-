const { cmd } = require('../NovaX_Mini');
const { sleep } = require('../lib/functions');
const { sendInteractive, qr, url } = require('../lib/interactive');
const config = require('../config');
const os = require('os');

const { getLang } = require('../lib/lang');
const { getUserLanguage } = require('../lib/database');

cmd({
    pattern: 'ping',
    desc: 'Live ping speed monitor',
    category: 'main',
    react: '⚡',
    filename: __filename
}, async (conn,  mek,  m, { from, sender, reply, quoted, text }) => {
    try {
        // Resolve per-user language at runtime
        let userLangCode = await getUserLanguage(sender);
        if (!userLangCode) userLangCode = (config.LANGUAGE || 'en').toLowerCase();
        const lang = getLang(userLangCode);

        await conn.sendMessage(from, { react: { text: '⚡', key: m.key } });

        const start = Date.now();
        await sleep(50);
        const ping = Date.now() - start;

        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const freeMem  = (os.freemem()  / 1024 / 1024).toFixed(0);
        const usedMem  = (totalMem - freeMem);
        const cpus     = os.cpus();
        const platform = os.platform();
        const prefix   = config.PREFIX || '.';

        const body =
            `╭━━━〔 *${lang.PING_TITLE}* 〕━━━┈\n` +
            `┃ 🏓 *${lang.PING_RES}:* ${ping}ms\n` +
            `┃ 💾 *RAM:* ${usedMem}MB / ${totalMem}MB\n` +
            `┃ 🖥️ *${lang.PING_CPU}:* ${cpus[0]?.model?.substring(0, 30) || 'Unknown'}\n` +
            `┃ 🔧 *${lang.PING_PLATFORM}:* ${platform}\n` +
            `┃ 🟢 *${lang.PING_STATUS}:* ${lang.PING_ONLINE}\n` +
            `╰━━━━━━━━━━━━━━━┈`;

        await sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body,
            footer: config.BOT_FOOTER,
            buttons: [
                qr(lang.MENU_BTN, `${prefix}menu`),
                qr(lang.ALIVE_BTN, `${prefix}alive`),
                qr(lang.PING_REFRESH, `${prefix}ping`),
            ]
        });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('Ping Error:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Ping failed — please try again.*\n╰━━━━━━━━━━━━━━━┈`
        }, { quoted: mek });
    }
});
