/**
 * NovaX Mini — YouTube MP3 Download Helper
 * Wraps the denethdev-ytmp3 (Ddownr) package for use by plugins.
 */

'use strict';

const Ddownr = require('denethdev-ytmp3');
const logger = require('./logger');

const downloader = new Ddownr();

/**
 * Download audio from a YouTube URL.
 * @param {string} youtubeUrl  YouTube video URL
 * @returns {Promise<{url: string, title: string, duration: string, thumbnail: string}>}
 */
async function downloadAudio(youtubeUrl) {
    try {
        const result = await downloader.download(youtubeUrl, 'mp3');
        return result;
    } catch (err) {
        logger.warn('[ytmp3] Download failed:', err.message);
        throw err;
    }
}

/**
 * Check progress of a download job.
 * @param {string} jobId
 */
async function checkProgress(jobId) {
    try {
        return await downloader.checkProgress(jobId);
    } catch (err) {
        logger.warn('[ytmp3] Progress check failed:', err.message);
        throw err;
    }
}

module.exports = { downloadAudio, checkProgress, downloader };
