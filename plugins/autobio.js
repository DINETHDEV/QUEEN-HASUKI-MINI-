const { cmd } = require('../NovaX_Mini');
const config = require('../config');

cmd({
  pattern: "autobio",
  alias: ["bioauto", "setautobio"],
  react: "😎",
  category: "owner",
  desc: "Toggle auto bio on/off",
  filename: __filename
}, async (conn,  mek,  m, { command, q, isOwner, reply }) => {
    const from = mek.key.remoteJid;
  try {

    if (!isOwner) {
      return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is for Owner only!*\n╰━━━━━━━━━━━━━━━┈`);
    }

    const state = q?.toLowerCase();

    if (!state || !["on", "off"].includes(state)) {
      return reply(`╭━━━〔 *😎 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Auto Bio Command*\n┃\n┃ ➤ .autobio on\n┃ ➤ .autobio off\n┃\n┃ 📌 *Status:* ${global.autoBio ? "ON ✅" : "OFF ❌"}\n╰━━━━━━━━━━━━━━━┈`);
    }

    global.autoBio = state === "on";

    if (global.autoBio) {
      updateBio(conn);
    }

    return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Auto Bio turned ${state.toUpperCase()} successfully!*\n╰━━━━━━━━━━━━━━━┈`);

  } catch (e) {
    console.log("AUTOBIO ERROR:", e);
    reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *An error occurred! Try again.*\n╰━━━━━━━━━━━━━━━┈`);
  }
});


// ================= BIO UPDATER =================
async function updateBio(conn) {
  if (!global.autoBio) return;

  try {
    const uptime = clockString(process.uptime() * 1000);
    const botname = config.BOT_NAME || "ɴᴏᴠᴀ_x ᴍɪɴɪ";

    const bio = `⚡ ${botname} ACTIVE (${uptime}) ⚡`;
    await conn.updateProfileStatus(bio);

    console.log("✅ BIO UPDATED:", bio);
  } catch (err) {
    console.log("❌ BIO UPDATE FAILED:", err.message);
  }

  setTimeout(() => updateBio(conn), 60 * 1000);
}


// ================= TIME FORMAT =================
function clockString(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;

  let str = "";
  if (d) str += `${d}D `;
  if (h) str += `${h}H `;
  if (m) str += `${m}M `;
  if (s) str += `${s}S`;
  return str.trim();
}
