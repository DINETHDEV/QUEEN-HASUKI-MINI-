/**
 * NovaX Bot — Interactive Message Helper
 * Powered by @itsliaaa/baileys
 *
 * Supports:
 *   - Quick Reply (QR) buttons
 *   - URL Call-to-Action buttons
 *   - Native Flow buttons
 *   - Image header + text + footer + buttons
 *   - Fallback to regular text/image if interactive fails
 *
 * Copyright © 2025 Zero Bug Zone
 */

'use strict';

const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@itsliaaa/baileys');
const logger = require('./logger');

/**
 * Quick reply button helper
 * @param {string} text Display text
 * @param {string} id   Command ID or callback ID
 */
function qr(text, id) {
    return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: text,
            id: id
        })
    };
}

/**
 * URL button helper
 * @param {string} text Display text
 * @param {string} url  Target URL
 */
function url(text, urlStr) {
    return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
            display_text: text,
            url: urlStr,
            merchant_url: urlStr
        })
    };
}

/**
 * Alias for qr
 */
function button(text, id) {
    return qr(text, id);
}

/**
 * Image header helper
 * @param {string} url Image URL
 */
function imgHeader(urlStr) {
    return { imageUrl: urlStr };
}

/**
 * Send an interactive message with buttons.
 *
 * @param {object} conn     Baileys WASocket connection
 * @param {string} from     Target JID
 * @param {object} mek      Quoted message (optional)
 * @param {object} options  Interactive message options:
 *   {
 *     title?: string,
 *     body?: string,
 *     caption?: string,
 *     footer?: string,
 *     imageUrl?: string,
 *     buttons?: Array<{ name: string, buttonParamsJson: string } | object>
 *   }
 */
async function sendInteractive(conn, from, mek, options = {}) {
    const textBody = options.body || options.caption || '';
    const footerText = options.footer || '';
    const titleText = options.title || '';
    const buttons = options.buttons || [];

    try {
        // Format buttons to NativeFlowButton format
        const nativeButtons = buttons.map(b => {
            if (b.name && b.buttonParamsJson) return b;
            if (b.type === 'url') return url(b.text || b.display_text, b.url);
            return qr(b.text || b.display_text || 'Button', b.id || b.command || '');
        });

        let headerObj = null;

        // If an image URL is provided, prepare media attachment
        if (options.imageUrl) {
            try {
                const mediaMsg = await prepareWAMessageMedia(
                    { image: { url: options.imageUrl } },
                    { upload: conn.waUploadToServer }
                );
                headerObj = proto.Message.InteractiveMessage.Header.create({
                    title: titleText,
                    hasMediaAttachment: true,
                    imageMessage: mediaMsg.imageMessage
                });
            } catch (imgErr) {
                logger.warn('[Interactive] Image preparation failed, proceeding without media header:', imgErr.message);
                headerObj = proto.Message.InteractiveMessage.Header.create({
                    title: titleText,
                    hasMediaAttachment: false
                });
            }
        } else if (titleText) {
            headerObj = proto.Message.InteractiveMessage.Header.create({
                title: titleText,
                hasMediaAttachment: false
            });
        }

        // Build InteractiveMessage structure
        const interactiveMsg = proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: textBody }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: footerText }),
            header: headerObj,
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: nativeButtons
            })
        });

        // Wrap in WAMessage
        const waMsg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: interactiveMsg
                }
            }
        }, { quoted: mek });

        await conn.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
        return waMsg;
    } catch (error) {
        logger.warn('[Interactive] Failed to send interactive message, falling back to text:', error.message);

        // Safe fallback if interactive fails
        let fallbackText = '';
        if (titleText) fallbackText += `*${titleText}*\n\n`;
        fallbackText += textBody;
        if (footerText) fallbackText += `\n\n_${footerText}_`;

        if (options.imageUrl) {
            return await conn.sendMessage(from, {
                image: { url: options.imageUrl },
                caption: fallbackText
            }, { quoted: mek });
        } else {
            return await conn.sendMessage(from, {
                text: fallbackText
            }, { quoted: mek });
        }
    }
}

module.exports = {
    sendInteractive,
    qr,
    url,
    button,
    imgHeader,
    select: qr // fallback for list select
};
