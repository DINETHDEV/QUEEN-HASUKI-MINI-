const { cmd } = require('../NovaX_Mini');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const crypto = require('crypto');
const config = require('../config');

// ════════════════════════════════════════════════════════
//  🎨 STICKER PLUGIN — ɴᴏᴠᴀ_x ᴍɪɴɪ
//  Convert image / video / gif → WhatsApp Sticker
// ════════════════════════════════════════════════════════

// Set ffmpeg path from installer (no system ffmpeg needed)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ── Helper: download media as Buffer ──
async function downloadMedia(targetMessage) {
    const { downloadContentFromMessage } = global.baileys;
    const msg = targetMessage.message;
    if (!msg) return null;

    const typeMap = {
        imageMessage: 'image',
        videoMessage: 'video',
        documentMessage: 'document',
        stickerMessage: 'sticker'
    };

    for (const [key, type] of Object.entries(typeMap)) {
        if (msg[key]) {
            const stream = await downloadContentFromMessage(msg[key], type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return {
                buffer: Buffer.concat(chunks),
                mediaMsg: msg[key],
                msgType: key
            };
        }
    }
    return null;
}

// ── Helper: fluent-ffmpeg convert to WebP ──
function convertToWebp(inputPath, outputPath, isAnimated, quality = 75, fps = 15, duration = null) {
    return new Promise((resolve, reject) => {
        let cmd = ffmpeg(inputPath);

        if (duration) cmd = cmd.duration(duration);

        const vfFilter = isAnimated
            ? `scale=512:512:force_original_aspect_ratio=decrease,fps=${fps},pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000`
            : `scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000`;

        cmd
            .videoCodec('libwebp')
            .addOutputOptions([
                '-vf', vfFilter,
                '-preset', 'default',
                '-loop', '0',
                '-vsync', '0',
                '-pix_fmt', 'yuva420p',
                `-quality`, `${quality}`,
                '-compression_level', '6',
                '-an'
            ])
            .toFormat('webp')
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}

// ── Helper: add sticker EXIF metadata ──
async function addStickerMeta(webpBuffer) {
    try {
        const webp = require('node-webpmux');
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': config.PACK_NAME || config.BOT_NAME || 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
            'sticker-pack-publisher': config.PACK_AUTHOR || 'NovaX',
            'emojis': ['🤖']
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuf]);
        exif.writeUIntLE(jsonBuf.length, 14, 4);
        img.exif = exif;

        return await img.save(null);
    } catch {
        return webpBuffer; // fallback: no metadata
    }
}

// ════════════════════════════════════════════════════════
//  COMMAND: .sticker / .s
// ════════════════════════════════════════════════════════

cmd({
    pattern: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    react: '🎨',
    desc: 'Convert image/video/gif to WhatsApp sticker',
    category: 'sticker',
    use: '.sticker (reply to image/video/gif, or send with caption)',
    filename: __filename
}, async (conn,  mek,  m, { quoted, body, text, reply }) => {
    const from = mek.key.remoteJid;
    try {

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // ── Find target message (quoted or direct) ──
        let targetMessage = mek;

        const quotedCtx = mek.message?.extendedTextMessage?.contextInfo;
        if (quotedCtx?.quotedMessage) {
            targetMessage = {
                key: {
                    remoteJid: from,
                    id: quotedCtx.stanzaId,
                    participant: quotedCtx.participant
                },
                message: quotedCtx.quotedMessage
            };
        }

        // ── Check media exists ──
        const msg = targetMessage.message || {};
        const hasMedia = msg.imageMessage || msg.videoMessage || msg.documentMessage;

        const { sendInteractive, qr } = require('../lib/interactive');
        const prefix = config.PREFIX || '.';

        if (!hasMedia) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body:
                    `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n` +
                    `┃ *Please reply to an image/video/gif*\n` +
                    `┃ *or send with .sticker as caption.*\n` +
                    `╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        // ── Download ──
        const downloaded = await downloadMedia(targetMessage);
        if (!downloaded) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to download media. Try again!*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        const { buffer: mediaBuffer, mediaMsg } = downloaded;

        // ── Setup temp paths ──
        const uid = crypto.randomBytes(6).toString('hex');
        const tempInput  = path.join(tmpdir(), `nova_in_${uid}`);
        const tempOutput = path.join(tmpdir(), `nova_out_${uid}.webp`);

        fs.writeFileSync(tempInput, mediaBuffer);

        // ── Detect animated ──
        const mime = mediaMsg?.mimetype || '';
        const isAnimated = mime.includes('video') || mime.includes('gif') || (mediaMsg?.seconds > 0);

        // ── Convert: main pass ──
        try {
            await convertToWebp(tempInput, tempOutput, isAnimated, 75, 15);
        } catch (ffErr) {
            console.error('[STICKER FFMPEG ERROR]', ffErr.message);
            try { fs.unlinkSync(tempInput); } catch {}
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Sticker creation failed!*\n┃ Error: ${ffErr.message.slice(0, 80)}\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        let webpBuffer = fs.readFileSync(tempOutput);

        // ── Fallback pass for large animated stickers (>1MB) ──
        if (isAnimated && webpBuffer.length > 1000 * 1024) {
            try {
                const tempFb = path.join(tmpdir(), `nova_fb_${uid}.webp`);
                const isLarge = mediaBuffer.length / 1024 > 5000;
                await convertToWebp(tempInput, tempFb, true,
                    isLarge ? 30 : 45,
                    isLarge ? 8  : 12,
                    isLarge ? 2  : 3
                );
                if (fs.existsSync(tempFb)) {
                    webpBuffer = fs.readFileSync(tempFb);
                    try { fs.unlinkSync(tempFb); } catch {}
                }
            } catch {}
        }

        // ── Second fallback: 320px tiny for still-too-large ──
        if (isAnimated && webpBuffer.length > 900 * 1024) {
            try {
                const tempSm = path.join(tmpdir(), `nova_sm_${uid}.webp`);
                await new Promise((res, rej) => {
                    ffmpeg(tempInput)
                        .duration(2)
                        .videoCodec('libwebp')
                        .addOutputOptions([
                            '-vf', 'scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                            '-preset', 'default', '-loop', '0', '-vsync', '0',
                            '-pix_fmt', 'yuva420p', '-quality', '25', '-compression_level', '6', '-an'
                        ])
                        .toFormat('webp').save(tempSm)
                        .on('end', res).on('error', rej);
                });
                if (fs.existsSync(tempSm)) {
                    webpBuffer = fs.readFileSync(tempSm);
                    try { fs.unlinkSync(tempSm); } catch {}
                }
            } catch {}
        }

        // ── Add EXIF metadata ──
        const finalBuffer = await addStickerMeta(webpBuffer);

        // ── Send ──
        await conn.sendMessage(from, { sticker: finalBuffer }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // ── Cleanup ──
        try { fs.unlinkSync(tempInput);  } catch {}
        try { fs.unlinkSync(tempOutput); } catch {}

    } catch (err) {
        console.error('[STICKER ERROR]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        const prefix = config.PREFIX || '.';
        const { sendInteractive, qr } = require('../lib/interactive');
        sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Failed to create sticker!*\n┃ Please try again later.\n╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }
});
