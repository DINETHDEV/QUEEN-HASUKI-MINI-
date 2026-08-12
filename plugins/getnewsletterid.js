
const { cmd } = require('../NovaX_Mini');
const config = require('../config');

cmd({
    pattern: "newsletter",
    alias: ["nl", "channelid"],
    react: "📰",
    desc: "Get current WhatsApp Channel JID",
    category: "tools",
    use: ".newsletter",
    filename: __filename
}, async (conn,  mek,  m, { quoted, command, text, reply }) => {
    const from = mek.key.remoteJid;
    try {

        const newsletterJid = m.chat;

        if (!newsletterJid.endsWith("@newsletter")) {
            return reply(
`╭━━━〔 *📰 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ ❌ *This command only works*
┃ *inside a WhatsApp Channel.*
╰━━━━━━━━━━━━━━━┈`
            );
        }

        if (!newsletterJid.startsWith("120")) {
            return reply(
`╭━━━〔 *📰 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ ❌ *Invalid Newsletter ID.*
╰━━━━━━━━━━━━━━━┈`
            );
        }

        await conn.sendMessage(from, {
            react: {
                text: "📡",
                key: mek.key
            }
        });

        const now = new Date().toLocaleString();

        await conn.sendMessage(from, {
            text:
`╭━━━〔 *📰 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 📢 *Current Channel ID*
┃
┃ ${newsletterJid}
┃
┃ 🕒 ${now}
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`
        }, { quoted: mek });

        // Fake Forwarded Newsletter Message
        await conn.sendMessage(
            from,
            {
                text: `Forwarded from another newsletter:\n\n${newsletterJid}`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363429597718924@newsletter",
                        newsletterName: "NovaX Mini",
                        serverMessageId: 101
                    }
                }
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.log(err);

        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });

        reply(
`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *Error:* ${err.message}
╰━━━━━━━━━━━━━━━┈`
        );
    }
});
