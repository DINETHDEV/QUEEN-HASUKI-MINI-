const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

const API_KEY = '434306d581f376e3aa290e7c7df966fc';

cmd({
    pattern: "tempmail",
    alias: ["tm", "tempmailgen", "genmail"],
    react: "📩",
    desc: "Generate a temporary email address using JuheAPI",
    category: "tools",
    use: ".tempmail",
    filename: __filename
}, async (conn,  mek,  m, { reply }) => {
    const from = mek.key.remoteJid;
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://hub.juheapi.com/temp-mail/v1/create?apikey=${API_KEY}`;
        
        let res;
        try {
            // Try POST first as per JuheAPI standard
            res = await axios.post(apiUrl, {});
        } catch (postErr) {
            // Fallback to GET
            res = await axios.get(apiUrl);
        }

        if (!res.data || !res.data.email) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to generate temp mail. Please try again later.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const email = res.data.email;
        const id = res.data.id || res.data.token || '';

        let text = `╭━━━〔 *📩 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ ✅ *Temp Mail Generated Successfully!*
┃ 
┃ 📧 *Email:* \`${email}\`
┃ 🔑 *Mailbox ID:* \`${id}\`
┃
┃ *Copy and use the ID below to check your inbox:*
┃ \`.checkmail ${id}\`
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await reply(text);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("TEMPMAIL GEN ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error generating TempMail: ${err.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "checkmail",
    alias: ["readmail", "tmcheck"],
    react: "📬",
    desc: "Check inbox of a temporary email using JuheAPI",
    category: "tools",
    use: ".checkmail <mailbox_id>",
    filename: __filename
}, async (conn,  mek,  m, { body, q, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide a Mailbox ID!*\n┃ *Example:* \`.checkmail <id>\`\n╰━━━━━━━━━━━━━━━┈`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://hub.juheapi.com/temp-mail/v1/get-emails?apikey=${API_KEY}`;
        
        let res;
        try {
            res = await axios.post(apiUrl, { id: q.trim() });
        } catch (postErr) {
            res = await axios.get(`${apiUrl}&id=${encodeURIComponent(q.trim())}`);
        }

        if (!res.data || !Array.isArray(res.data)) {
            return reply(`╭━━━〔 *📬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 📥 *Inbox is empty or invalid ID!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        const emails = res.data;

        if (emails.length === 0) {
            await conn.sendMessage(from, { react: { text: "📭", key: mek.key } });
            return reply(`╭━━━〔 *📬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 📭 *Inbox is empty.*\n╰━━━━━━━━━━━━━━━┈`);
        }

        let text = `╭━━━〔 *📬 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ 📊 *Inbox: ${emails.length} message(s)*\n╰━━━━━━━━━━━━━━━┈\n\n`;

        emails.forEach((email, i) => {
            text += `*${i + 1}. From:* ${email.from || 'Unknown'}\n`;
            text += `*Subject:* ${email.subject || 'No Subject'}\n`;
            text += `*Content:* ${email.body || 'No content'}\n`;
            text += `───────────────────\n\n`;
        });

        text += `> ${config.BOT_FOOTER}`;

        await reply(text);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("CHECKMAIL ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error checking email: ${err.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
