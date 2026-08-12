const { cmd } = require('../NovaX_Mini');

cmd({
  pattern: "block",
  alias: ["blk", "blok"],
  react: "🚫",
  category: "owner",
  desc: "Block a user (reply or inbox)",
  filename: __filename
}, async (conn,  mek,  m, { quoted, command, text, sender, isOwner }) => {
    const from = mek.key.remoteJid;
  try {

    if (!isOwner) {
      return conn.sendMessage(from, {
        text: `╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is for Owner only!*\n╰━━━━━━━━━━━━━━━┈`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363429597718924@newsletter',
            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    }

    let jid;

    if (m.quoted) {
      jid = m.quoted.sender;
    }
    else if (from.endsWith("@s.whatsapp.net")) {
      jid = from;
    } 
    else {
      return conn.sendMessage(from, {
        text: `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Reply to a message or use in inbox to block!*\n╰━━━━━━━━━━━━━━━┈`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363429597718924@newsletter',
            newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    }

    await conn.updateBlockStatus(jid, "block");

    await conn.sendMessage(from, {
      react: { text: "🚫", key: mek.key }
    });

    await conn.sendMessage(from, {
      text: `╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *User has been successfully blocked!*\n╰━━━━━━━━━━━━━━━┈`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363429597718924@newsletter',
          newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
          serverMessageId: 143
        }
      },
      mentions: [jid]
    }, { quoted: mek });

  } catch (e) {
    console.log("BLOCK ERROR:", e);
    await conn.sendMessage(from, {
      text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Block failed! Please try again.*\n╰━━━━━━━━━━━━━━━┈`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363429597718924@newsletter',
          newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });
  }
});
