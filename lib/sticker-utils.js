/**
 * NovaX Mini — Sticker Utils
 * Helpers: fetchGif(), gifToSticker()
 * Used by attp.js and similar sticker plugins.
 */

'use strict';

const axios = require('axios');
const sharp = require('sharp');
const logger = require('./logger');

/**
 * Fetch raw buffer from a URL (GIF, image, etc.)
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
async function fetchGif(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'NovaX-Mini/3.0' }
        });
        return Buffer.from(response.data);
    } catch (err) {
        logger.warn('[sticker-utils] fetchGif failed:', err.message);
        throw new Error(`Failed to fetch media from URL: ${err.message}`);
    }
}

/**
 * Convert a GIF/image buffer to a WebP sticker buffer.
 * @param {Buffer} buffer  Input image/GIF buffer
 * @returns {Promise<Buffer>} WebP sticker buffer
 */
async function gifToSticker(buffer) {
    try {
        const webp = await sharp(buffer, { animated: true })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();
        return webp;
    } catch (err) {
        // Fallback: try without animated flag (static image)
        try {
            const webp = await sharp(buffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 80 })
                .toBuffer();
            return webp;
        } catch (fallbackErr) {
            logger.warn('[sticker-utils] gifToSticker failed:', fallbackErr.message);
            throw new Error(`Sticker conversion failed: ${fallbackErr.message}`);
        }
    }
}

/**
 * Convert any image URL directly to a sticker buffer.
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
async function urlToSticker(url) {
    const buf = await fetchGif(url);
    return gifToSticker(buf);
}

module.exports = { fetchGif, gifToSticker, urlToSticker };
