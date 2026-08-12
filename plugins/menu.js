/**
 * Menu Plugin (NovaX Mini) - Interactive Version
 * Powered by @itsliaaa/baileys
 */

const { sendInteractive, qr } = require('../lib/interactive');
const config = require('../config');

module.exports = async (socket, msg, bot) => {
    try {
        const prefix = (bot && bot.settings && bot.settings.prefix) ? bot.settings.prefix : (config.PREFIX || '.');
        const botName = bot ? (bot.botName || config.BOT_NAME || 'NovaX Mini') : (config.BOT_NAME || 'NovaX Mini');
        const version = config.BOT_VERSION || '3.0.0';

        const menuText = `⚡ *${botName}* ⚡
Advanced WhatsApp Bot

🤖 *BOT INFO*
• Name: ${botName}
• Version: v${version}
• Prefix: ${prefix}
• Status: Online ✅`;

        await sendInteractive(socket, msg.key.remoteJid, msg, {
            title: '👑 NovaX Mini Menu',
            body: menuText,
            footer: '© 2025 Zero Bug Zone',
            buttons: [
                qr('⚡ Alive', `${prefix}alive`),
                qr('🏓 Ping', `${prefix}ping`),
                qr('📋 All Menu', `${prefix}allmenu`),
            ]
        });

    } catch (error) {
        console.error('Menu command error:', error);
        await socket.sendMessage(msg.key.remoteJid, {
            text: '❌ Error executing menu command'
        }, { quoted: msg });
    }
};
