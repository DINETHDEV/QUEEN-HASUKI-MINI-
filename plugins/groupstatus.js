const { cmd } = require("../NovaX_Mini");

cmd({
    pattern: "group",
    alias: ["gstatus", "poststatus", "statuspost"],
    desc: "Post text or media to WhatsApp Status",
    category: "group",
    react: "📡",
    filename: __filename
},
    async (conn, mek, m, { body, reply, pushname }) => {
    const from = mek.key.remoteJid;
        try {

            const caption = body.split(" ").slice(1).join(" ");

            // TEXT STATUS
            if (!m.quoted && caption) {

                await conn.sendMessage(
                    "status@broadcast",
                    {
                        text:
                            `╭━━━〔 *ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 👤 *Posted By:* ${pushname}
┃ 🕒 ${new Date().toLocaleString()}
┃
┃ 💬 *Message:*
┃ ${caption}
╰━━━━━━━━━━━━━━━┈`
                    }
                );

                return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Text status posted successfully!*\n╰━━━━━━━━━━━━━━━┈`);
            }

            if (!m.quoted) {
                return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Reply to an image, video, audio, or sticker.*\n┃ *Or type text after the command.*\n┃ *Example:* .groupstatus Hello World\n╰━━━━━━━━━━━━━━━┈`);
            }

            const quoted = m.quoted;
            const media = await quoted.download();

            // IMAGE
            if (quoted.imageMessage) {

                await conn.sendMessage(
                    "status@broadcast",
                    {
                        image: media,
                        caption:
                            `╭━━━〔 *ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 📸 *Posted By:* ${pushname}
┃ 🕒 ${new Date().toLocaleString()}
┃
┃ ${caption || "No Caption"}
╰━━━━━━━━━━━━━━━┈`
                    }
                );

                return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Image status posted!*\n╰━━━━━━━━━━━━━━━┈`);
            }

            // VIDEO
            if (quoted.videoMessage) {

                await conn.sendMessage(
                    "status@broadcast",
                    {
                        video: media,
                        caption:
                            `╭━━━〔 *ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ 🎥 *Posted By:* ${pushname}
┃ 🕒 ${new Date().toLocaleString()}
┃
┃ ${caption || "No Caption"}
╰━━━━━━━━━━━━━━━┈`
                    }
                );

                return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Video status posted!*\n╰━━━━━━━━━━━━━━━┈`);
            }

            // AUDIO
            if (quoted.audioMessage) {

                await conn.sendMessage(
                    "status@broadcast",
                    {
                        audio: media,
                        mimetype: "audio/mp4",
                        ptt: false
                    }
                );

                return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Audio status posted!*\n╰━━━━━━━━━━━━━━━┈`);
            }

            // STICKER
            if (quoted.stickerMessage) {

                await conn.sendMessage(
                    "status@broadcast",
                    {
                        sticker: media
                    }
                );

                return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Sticker status posted!*\n╰━━━━━━━━━━━━━━━┈`);
            }

            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Unsupported media type!*\n╰━━━━━━━━━━━━━━━┈`);

        } catch (err) {
            console.log("GROUPSTATUS ERROR:", err);

            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Status post failed!*\n┃ *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`);
        }
    });
