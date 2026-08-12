const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

cmd({
  pattern: "screenshot",
  alias: ["ss", "webshot", "sitepic"],
  react: "🖥️",
  category: "tools",
  desc: "Take full HD desktop screenshot of a website",
  filename: __filename
}, async (conn,  mek,  m, { body, q, reply }) => {
    const from = mek.key.remoteJid;
  try {
    if (!q) {
      return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a website URL!*\n┃ *Example:* .screenshot https://google.com\n╰━━━━━━━━━━━━━━━┈`);
    }

    const apiUrl = `https://movanest.xyz/v2/ssweb?url=${encodeURIComponent(q)}&width=1280&height=720&full_page=true`;
    const res = await axios.get(apiUrl, { timeout: 60000 });

    if (!res.data || !res.data.status || !res.data.screenshot) {
      return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Screenshot failed! API did not respond.*\n╰━━━━━━━━━━━━━━━┈`);
    }

    const screenshotUrl = res.data.screenshot;

    const { sendInteractive, qr } = require('../lib/interactive');
    await sendInteractive(conn, from, mek, {
      imageUrl: screenshotUrl,
      body: `╭━━━〔 *🖥️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 🌐 *Screenshot of:*\n┃ ${q}\n╰━━━━━━━━━━━━━━━┈`,
      buttons: [
        qr('📋 MENU', `${config.PREFIX || '.'}menu`),
        qr('🔍 NEXT', `${config.PREFIX || '.'}ss ${q}`)
      ]
    });

  } catch (err) {
    console.error("SCREENSHOT COMMAND ERROR:", err.message);
    reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Screenshot failed! Please try again later.*\n╰━━━━━━━━━━━━━━━┈`);
  }
});
