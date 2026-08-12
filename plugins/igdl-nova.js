const axios = require('axios');
const config = require('../config');
const { cmd } = require('../NovaX_Mini');
const { sendInteractive, qr, url, errMsg } = require('../lib/interactive');

const sendErr = async (conn, mek, from, text) =>
    conn.sendMessage(from, { text: errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', text) }, { quoted: mek });

cmd({
    pattern: 'ig',
    alias: ['insta5', 'ig5', 'instagram5', 'reeldl', 'instagram'],
    desc: 'Download Instagram Video/Reel',
    category: 'download',
    react: '📥',
    filename: __filename
}, async (conn,  mek,  m, { q, reply, body, text }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || '.';

        if (!q || !q.includes('instagram.com')) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *📸 Instagram DL* 〕━━━┈\n┃ *Usage:* .ig <url>\n┃ *Example:* .ig https://www.instagram.com/reel/...\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const api = `https://www.movanest.xyz/v2/instagram?url=${encodeURIComponent(q)}`;
        const res = await axios.get(api, { timeout: 30000 });

        if (!res.data || res.data.status !== true || !res.data.results) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *${res.data?.error || 'Failed to fetch Instagram media!'}*\n┃ *Make sure the post is public.*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('🔄 Retry', `${prefix}ig ${q}`), qr('📋 Menu', `${prefix}menu`)]
            });
        }

        const result = res.data.results;
        const videoUrl = result.downloadUrl || result.videoUrl;
        const thumbUrl = result.posterUrl || config.IMAGE_PATH;

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', 'Could not extract video URL!'));
        }

        // Send info card with thumbnail
        await sendInteractive(conn, from, mek, {
            imageUrl: thumbUrl,
            body:
                `╭━━━〔 *📸 ɴᴏᴠᴀ_x ᴍɪɴɪ — Instagram* 〕━━━┈\n` +
                `┃ 🎬 *Reel/Video Found!*\n` +
                `┃ ⚡ *Downloading now...*\n` +
                `╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [
                url('📸 Open Instagram', q),
                qr('📋 Menu', `${prefix}menu`)
            ]
        });

        // Send the actual video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption:
                `╭━━━〔 *📸 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n` +
                `┃ 📲 *Instagram Downloader*\n` +
                `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`,
            contextInfo: {
                externalAdReply: {
                    title: 'Instagram Reel',
                    body: '📥 Downloaded by ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    thumbnailUrl: thumbUrl,
                    sourceUrl: q,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('IGDL ERROR:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(errMsg('ɴᴏᴠᴀ_x ᴍɪɴɪ', 'Instagram download failed! Try again.'));
    }
});
