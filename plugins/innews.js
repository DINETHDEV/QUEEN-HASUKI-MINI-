const { cmd } = require('../NovaX_Mini');
const axios = require('axios');

cmd({
    pattern: "intnews",
    alias: ["international", "worldnews"],
    react: "🌍",
    desc: "Latest International News",
    category: "news",
    use: ".intnews",
    filename: __filename
}, async (conn,  mek,  m, { quoted, text, reply }) => {
    const from = mek.key.remoteJid;

    try {

        await conn.sendMessage(from, {
            react: {
                text: "📡",
                key: mek.key
            }
        });

        const { data } = await axios.get(
            "https://www.movanest.xyz/v2/news/fetch?category=international&numSites=5",
            {
                timeout: 20000,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json"
                }
            }
        );

        if (!data.status) {
            return reply("❌ Failed to fetch news.");
        }

        const news = data.results.filter(n => !n.error);

        if (!news.length) {
            return reply("❌ No news found.");
        }

        for (const item of news) {

            let caption = `🌍 *INTERNATIONAL NEWS*\n\n`;

            caption += `📰 *${item.title || "No Title"}*\n\n`;

            if (item.site)
                caption += `🏢 *Source:* ${item.site}\n`;

            if (item.date)
                caption += `📅 *Date:* ${new Date(item.date).toLocaleString()}\n`;

            if (item.description)
                caption += `\n📝 ${item.description}\n`;

            if (item.url)
                caption += `\n🔗 ${item.url}`;

            caption += `\n\n> © NovaX_Mini`;

            if (item.image) {

                await conn.sendMessage(
                    from,
                    {
                        image: {
                            url: item.image
                        },
                        caption,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363429597718924@newsletter',
                                newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                                serverMessageId: 143
                            }
                        }
                    },
                    {
                        quoted: mek
                    }
                );

            } else {

                await conn.sendMessage(
                    from,
                    {
                        text: caption,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363429597718924@newsletter',
                                newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                                serverMessageId: 143
                            }
                        }
                    },
                    {
                        quoted: mek
                    }
                );

            }

        }

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {

        console.log(err.response?.data || err);

        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });

        reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ ❌ ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);

    }

});