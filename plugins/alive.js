const { cmd } = require("../NovaX_Mini");
const moment = require("moment-timezone");
const os = require("os");
const config = require("../config");

const { sendInteractive, qr, url } = require("../lib/interactive");
const { getLang } = require("../lib/lang");
const { getUserLanguage } = require("../lib/database");

let botStartTime = Date.now();

const ALIVE_IMG =
  config.IMAGE_PATH || "https://files.catbox.moe/aeg27n.png";

cmd(
  {
    pattern: "alive",
    alias: ["botstatus", "systemstatus"],
    desc: "Check if the bot is active.",
    category: "system",
    react: "⚡",
    filename: __filename,
  },
  async (conn, mek, m, { reply, from, sender }) => {
    try {
      // Resolve per-user language at runtime
      let userLangCode = await getUserLanguage(sender);
      if (!userLangCode) userLangCode = (config.LANGUAGE || 'en').toLowerCase();
      const lang = getLang(userLangCode);

      const pushname = m.pushName || "User";

      const currentTime = moment()
        .tz("Asia/Colombo")
        .format("HH:mm:ss");

      const currentDate = moment()
        .tz("Asia/Colombo")
        .format("dddd, MMMM Do YYYY");

      const runtime = Date.now() - botStartTime;

      const hours = Math.floor(runtime / (1000 * 60 * 60));
      const minutes = Math.floor((runtime / (1000 * 60)) % 60);
      const seconds = Math.floor((runtime / 1000) % 60);

      const uptime = `${hours}h ${minutes}m ${seconds}s`;

      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
      const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
      const usedMem = (totalMem - freeMem).toFixed(0);

      const prefix = config.PREFIX || ".";

      const version = require("../package.json").version;

      const formattedInfo = `
╭━━━━━━━━━━━━━━━━━━━━━━━❊
┃      ⚡ ɴᴏᴠᴀx ᴍɪɴɪ ⚡
┃   sʏsᴛᴇᴍ • sᴛᴀᴛᴜs
╰━━━━━━━━━━━━━━━━━━━━━━━❊

👋 Hello *${pushname}*

╭──〔 🤖 ${lang.BOT_INFO || 'BOT INFO'} 〕
┃ 🟢 Status   : ${lang.STATUS_ONLINE || 'ONLINE'}
┃ 📦 Version  : v${version}
┃ ⚙ Prefix    : ${prefix}
┃ 👑 Owner    : ${config.OWNER_NAME || "Dineth Sudarshana"}
╰─────────────────────

╭──〔 ⚡ ${lang.PERFORMANCE || 'PERFORMANCE'} 〕
┃ ⏳ Uptime   : ${uptime}
┃ 💾 RAM      : ${usedMem} MB / ${totalMem} MB
┃ 🖥 Platform : ${os.platform()}
┃ 💻 Host     : ${os.hostname()}
╰─────────────────────

╭──〔 📅 ${lang.DATE_TIME || 'DATE & TIME'} 〕
┃ 📆 ${currentDate}
┃ 🕒 ${currentTime}
╰─────────────────────

╭──〔 🚀 ${lang.NOVAX_ENGINE || 'NOVAX MINI'} 〕
┃ ${lang.ALIVE_MSG}
┃
┃ ${lang.PREMIUM_BOT || '✨ Premium WhatsApp Bot'}
┃ ${lang.FAST_RESP   || '⚡ Fast Response'}
┃ ${lang.STABLE      || '🔥 Stable Performance'}
┃ ${lang.SECURE      || '🛡 Secure System'}
╰─────────────────────

🌐 *Official Channel*
${config.CHANNEL_LINK ||
        "https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A"}

> ${config.BOT_FOOTER}
`.trim();

      await sendInteractive(conn, from, mek, {
        imageUrl: ALIVE_IMG,
        body: formattedInfo,

        buttons: [
          qr(lang.MENU_BTN || "📋 MENU", `${prefix}menu`),
          qr(lang.PING_REFRESH || "🏓 PING", `${prefix}ping`),
          url(
            "📢 CHANNEL",
            config.CHANNEL_LINK ||
              "https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A"
          ),
        ],
      });
    } catch (error) {
      console.error(error);

      return reply(
        `╭━━━〔 ❌ ERROR 〕━━━
┃ ${error.message}
╰━━━━━━━━━━━━━━
> ${config.BOT_FOOTER}`
      );
    }
  }
);
