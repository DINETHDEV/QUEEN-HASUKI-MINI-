const { cmd } = require('../NovaX_Mini')
const { fetchGif, gifToSticker } = require('../lib/sticker-utils')

cmd({
    pattern: "attp",
    alias: ["attptext", "textsticker", "namesticker", "stickername", "at", "att", "atp"],
    react: "✨",
    desc: "Convert text into animated sticker",
    category: "sticker",
    use: ".attp <text>",
    filename: __filename
},
async (conn,  mek,  m, { args, reply, quoted }) => {
    const from = mek.key.remoteJid;
    try {
        if (!args[0]) {
            return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please provide text to make a sticker!*\n┃ *Example:* .attp NovaX_Mini\n╰━━━━━━━━━━━━━━━┈`)
        }

        reply(`╭━━━〔 *✨ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Creating your sticker... Please wait!*\n╰━━━━━━━━━━━━━━━┈`)

        const text = encodeURIComponent(args.join(" "))
        const gifBuffer = await fetchGif(
            `https://api-fix.onrender.com/api/maker/attp?text=${text}`
        )

        const sticker = await gifToSticker(gifBuffer)

        await conn.sendMessage(
            m.chat,
            { sticker },
            { quoted: mek }
        )

    } catch (e) {
        console.log("ATTP ERROR:", e)
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Sticker creation failed! Try again.*\n╰━━━━━━━━━━━━━━━┈`)
    }
})
