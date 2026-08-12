const { cmd } = require('../NovaX_Mini');
const { fakevCard } = require('../lib/fakevCard');
const os = require('os');
const config = require('../config');
const { sendInteractive, qr, url } = require('../lib/interactive');

const { getLang } = require('../lib/lang');
const lang = getLang(config.LANGUAGE);

// ════════════════════════════════════════════
//  🖥️ SYSTEM INFO
// ════════════════════════════════════════════

let botStartTime = Date.now();

// RAM usage format කරනවා
function formatBytes(bytes) {
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1) return gb.toFixed(2) + ' GB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// Uptime format කරනවා
function getUptime() {
    const ms   = Date.now() - botStartTime;
    const sec  = Math.floor((ms / 1000) % 60);
    const min  = Math.floor((ms / (1000 * 60)) % 60);
    const hr   = Math.floor(ms / (1000 * 60 * 60));
    return `${hr}h ${min}m ${sec}s`;
}

// CPU model ගන්නවා
function getCpuModel() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 'Unknown';
    return cpus[0].model || 'Unknown';
}

// CPU speed ගන්නවා
function getCpuSpeed() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return '0 MHz';
    return cpus[0].speed + ' MHz';
}

cmd({
    pattern: 'system',
    alias: ['sysinfo', 'sys', 'botinfo', 'specs'],
    desc: 'Show bot system information',
    category: 'info',
    react: '🖥️',
    use: '.system',
    filename: __filename
},
async (conn,  mek,  m, { body, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: lang.LOADING, key: mek.key } });

        // ── System Data ──────────────────────────────────────────
        const platform    = os.platform();
        const osType      = os.type();
        const osRelease   = os.release();
        const arch        = os.arch();
        const hostname    = os.hostname();
        const cpuCores    = os.cpus().length;
        const cpuModel    = getCpuModel();
        const cpuSpeed    = getCpuSpeed();
        const totalMem    = formatBytes(os.totalmem());
        const freeMem     = formatBytes(os.freemem());
        const usedMem     = formatBytes(os.totalmem() - os.freemem());
        const memPercent  = ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1);
        const nodeVer     = process.version;
        const uptime      = getUptime();
        const osUptime    = (() => {
            const s  = Math.floor(os.uptime());
            const h  = Math.floor(s / 3600);
            const mn = Math.floor((s % 3600) / 60);
            return `${h}h ${mn}m`;
        })();

        // Platform emoji
        const platEmoji = platform === 'win32' ? '🪟' :
                          platform === 'linux'  ? '🐧' :
                          platform === 'darwin' ? '🍎' : '💻';

        // ── Message ──────────────────────────────────────────────
        const systemText =
`╭━━━〔 *${lang.SYS_TITLE}* 〕━━━┈
┃
┃ 🤖 *BOT INFO*
┃ ◈ ⏱️ *${lang.MENU_UPTIME}:* ${uptime}
┃ ◈ 🟢 *${lang.PING_STATUS}:* ${lang.PING_ONLINE}
┃ ◈ ⚙️ *Node.js:* ${nodeVer}
┃
┃ ${platEmoji} *${lang.SYS_OS}*
┃ ◈ 📡 *${lang.PING_PLATFORM}:* ${platform}
┃ ◈ 🧸 *OS Type:* ${osType}
┃ ◈ 📦 *Release:* ${osRelease}
┃ ◈ 🔧 *${lang.SYS_ARCH}:* ${arch}
┃ ◈ 🌐 *Hostname:* ${hostname}
┃ ◈ ⏳ *OS Uptime:* ${osUptime}
┃
┃ 🧠 *${lang.PING_CPU}*
┃ ◈ 🔢 *Cores:* ${cpuCores}
┃ ◈ ⚡ *Speed:* ${cpuSpeed}
┃ ◈ 📋 *Model:* ${cpuModel.slice(0, 35)}
┃
┃ 💾 *${lang.SYS_MEM.toUpperCase()}*
┃ ◈ 📊 *Total:* ${totalMem}
┃ ◈ 🔴 *Used:* ${usedMem} (${memPercent}%)
┃ ◈ 🟢 *Free:* ${freeMem}
╰━━━━━━━━━━━━━━━┈`;

        // ── Image URL ────────────────────────────────────────────
        const imgUrl = (config.IMAGE_PATH && String(config.IMAGE_PATH).startsWith('http'))
            ? config.IMAGE_PATH
            : 'https://files.catbox.moe/aeg27n.png';

        const prefix = config.PREFIX || '.';

        await sendInteractive(conn, from, mek, {
            imageUrl: imgUrl,
            body: systemText,
            buttons: [
                qr(lang.MENU_BTN, `${prefix}menu`),
                qr(lang.PING_BTN, `${prefix}ping`),
                url(`👨‍💻 ${lang.MENU_OWNER.toUpperCase()}`, config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A')
            ]
        });

        await conn.sendMessage(from, { react: { text: lang.SUCCESS, key: mek.key } });

    } catch (err) {
        console.error('SYSTEM CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: lang.ERROR, key: mek.key } });
        reply(
`╭━━━〔 *${lang.ERROR} ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *System info fetch failed!*
┃ ${err.message}
╰━━━━━━━━━━━━━━━┈`
        );
    }
});
