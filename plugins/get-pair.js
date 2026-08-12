const { cmd, commands } = require('../NovaX_Mini');
const axios = require('axios');

cmd({
    pattern: "pair",
    alias: ["getpair", "pairing", "clonebnsjdndnznot"],
    react: "✅",
    desc: "Get pairing code for NovaX_Mini-MD bot",
    category: "download",
    use: ".pair 92323***",
    filename: __filename
}, async (conn,  mek,  m, { q, senderNumber, from, quoted, command, text }) => {
    from = from || mek.key.remoteJid;
    try {
        // Helper to send messages with explicit Newsletter context JID
        const sendMsg = async (text) => {
            return await conn.sendMessage(from, {
                text,
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
        };

        // Extract phone number from command
        const phoneNumber = (q ? q : senderNumber || '').trim().replace(/[^0-9]/g, '');

        // Validate phone number format
        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            return await sendMsg(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a valid phone number without \`+\`\nExample: \`.pair 92323***\`*\n╰━━━━━━━━━━━━━━━┈`);
        }

        // Make API request to get pairing code
        const response = await axios.get(`https://novax-mini.up.railway.app/code?number=${encodeURIComponent(phoneNumber)}`);

        if (response.data && response.data.status === 'already_connected') {
            return await sendMsg(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This number is already connected and active!*\n┃ *Uptime: ${response.data.uptime || 'N/A'}*\n╰━━━━━━━━━━━━━━━┈`);
        }
        
        if (response.data && response.data.status === 'connection_in_progress') {
            return await sendMsg(`╭━━━〔 *⏳ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *A connection is already in progress for this number. Please wait a moment.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        if (response.data && response.data.status === 'reconnecting') {
            return await sendMsg(`╭━━━〔 *⏳ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Reconnecting with an existing session for this number...*\n╰━━━━━━━━━━━━━━━┈`);
        }

        if (!response.data || !response.data.code) {
            return await sendMsg(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to retrieve pairing code. Please try again later.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const pairingCode = response.data.code;
        const doneMessage = `┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃        🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ
┣━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ✅ Pairing Successful
┃
┃  🔐 Pair Code
┃
┃      \`${pairingCode}\`
┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫
┃ WhatsApp
┃ ➜ Linked Devices
┃ ➜ Link with phone number
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;

        // Send initial message with formatting
        await sendMsg(doneMessage);

        // Optional 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send clean code again
        await sendMsg(`\`${pairingCode}\``);

    } catch (error) {
        console.error("Pair command error:", error);
        await sendMsg(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *An error occurred while getting pairing code. Please try again later.*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
