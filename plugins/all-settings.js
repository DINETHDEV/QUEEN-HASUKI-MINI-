const { cmd } = require('../NovaX_Mini');
const { updateUserConfig } = require('../lib/database');

// Helper function to update config in memory and database
const updateConfig = async (key, value, botNumber, config, reply) => {
    try {
        // 1. Update in-memory config (Immediate)
        config[key] = value;
        
        // 2. Update in Database (Persistent)
        const newConfig = { ...config }; 
        newConfig[key] = value;
        
        await updateUserConfig(botNumber, newConfig);
        
        return reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *${key}* has been updated to: *${value}*\n╰━━━━━━━━━━━━━━━┈`);
    } catch (e) {
        console.error(e);
        return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Error while saving to database.*\n╰━━━━━━━━━━━━━━━┈`);
    }
};

// ============================================================
// 1. PRESENCE MANAGEMENT (Recording / Typing)
// ============================================================

cmd({
    pattern: "autorecording",
    alias: ["autorec", "arecording"],
    desc: "Enable/Disable auto recording simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_RECORDING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_RECORDING', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.AUTO_RECORDING}* 😊\n┃ \n┃ *To turn ON Auto Recording, type:*\n┃ *.autorecording on*\n┃ *To turn OFF Auto Recording, type:*\n┃ *.autorecording off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "autotyping",
    alias: ["autotype", "atyping"],
    desc: "Enable/Disable auto typing simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_TYPING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_TYPING', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *🤖 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.AUTO_TYPING}* 😊\n┃ \n┃ *To turn ON Auto Typing, type:*\n┃ *.autotyping on*\n┃ *To turn OFF Auto Typing, type:*\n┃ *.autotyping off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ============================================================
// 2. CALL MANAGEMENT (Anti-Call)
// ============================================================

cmd({
    pattern: "anticall",
    alias: "acall",
    desc: "Auto reject calls",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('ANTI_CALL', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('ANTI_CALL', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *📞 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.ANTI_CALL}* 😊\n┃ \n┃ *All incoming calls will be auto-rejected.* 😃\n┃ *To turn ON Anti-Call, type:*\n┃ *.anticall on*\n┃ *To turn OFF Anti-Call, type:*\n┃ *.anticall off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ============================================================
// 3. GROUP MANAGEMENT (Welcome / Goodbye)
// ============================================================

cmd({
    pattern: "welcome",
    desc: "Enable/Disable welcome messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('WELCOME', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('WELCOME', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *👋 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.WELCOME}* 😊\n┃ \n┃ *Sends a greeting to new group members.* 😃\n┃ *To turn ON Welcome, type:*\n┃ *.welcome on*\n┃ *To turn OFF Welcome, type:*\n┃ *.welcome off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "goodbye",
    desc: "Enable/Disable goodbye messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('GOODBYE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('GOODBYE', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *👋 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.GOODBYE}* 😊\n┃ \n┃ *Sends a farewell to members leaving.* 😃\n┃ *To turn ON Goodbye, type:*\n┃ *.goodbye on*\n┃ *To turn OFF Goodbye, type:*\n┃ *.goodbye off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ============================================================
// 4. READ & STATUS MANAGEMENT
// ============================================================

cmd({
    pattern: "autoread",
    desc: "Enable/Disable auto read messages (Blue Tick)",
    category: "settings",
    react: "👀"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('READ_MESSAGE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('READ_MESSAGE', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *👀 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.READ_MESSAGE}* 😊\n┃ \n┃ *Automatically marks received messages as read.* 😃\n┃ *To turn ON Auto Read, type:*\n┃ *.autoread on*\n┃ *To turn OFF Auto Read, type:*\n┃ *.autoread off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "autoviewsview",
    alias: ["avs", "statusseen", "astatus"],
    desc: "Auto view status updates",
    category: "settings",
    react: "😎"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_VIEW_STATUS', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_VIEW_STATUS', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *😎 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Status: ${config.AUTO_VIEW_STATUS}* 😊\n┃ \n┃ *Automatically views status updates of contacts.* 😃\n┃ *To turn ON Auto Status View, type:*\n┃ *.autoviewsview on*\n┃ *To turn OFF Auto Status View, type:*\n┃ *.autoviewsview off*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "autolikestatus",
    alias: ["als"],
    desc: "Auto like status updates",
    category: "settings",
    react: "❤️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply(`╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Owner only!*\n╰━━━━━━━━━━━━━━━┈`);
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_LIKE_STATUS', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_LIKE_STATUS', 'false', botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *✅ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ Current Status: ${config.AUTO_LIKE_STATUS}\nUsage: .autolikestatus on/off\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});

// ============================================================
// 5. SYSTEM (Mode & Prefix)
// ============================================================

cmd({
    pattern: "mode",
    desc: "Change bot mode (public/private/groups/inbox)",
    category: "settings",
    react: "⚙️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const mode = args[0]?.toLowerCase();
    const validModes = ['public', 'private', 'groups', 'inbox'];

    if (validModes.includes(mode)) {
        const oldMode = config.WORK_TYPE;
        await updateConfig('WORK_TYPE', mode, botNumber, config, reply);
        if (oldMode !== mode) {
            try {
                const botJid = botNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await conn.sendMessage(botJid, { text: `📢 *Work Mode changed to:* ${mode.toUpperCase()}` });
            } catch (e) {
                console.error("Failed to send work mode notification to bot number:", e);
            }
        }
    } else {
        reply(`╭━━━〔 *⚙️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Invalid Work Mode!* 🥺\n┃ \n┃ *Please select a valid mode from the list:*\n┃ *${validModes.join(', ')}*\n┃ \n┃ *Usage: .mode <work_mode>*\n┃ *Current Mode: ${config.WORK_TYPE}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

cmd({
    pattern: "setprefix",
    desc: "Change bot prefix",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    const from = mek.key.remoteJid;
    if (!isOwner) return reply("╭━━━〔 *🚫 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is only for the Owner! 😎*\n╰━━━━━━━━━━━━━━━┈");
    const newPrefix = args[0];

    if (newPrefix) {
        // Ensure prefix is short (single character or short string)
        if (newPrefix.length > 1 && newPrefix !== 'noprefix') return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Prefix must be short (e.g. . or ! or #)*\n╰━━━━━━━━━━━━━━━┈`);
        
        await updateConfig('PREFIX', newPrefix, botNumber, config, reply);
    } else {
        reply(`╭━━━〔 *👑 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Current Prefix is: ❮ ${config.PREFIX} ❯* ☺️\n┃ \n┃ *To change the command prefix, type:*\n┃ *.setprefix <prefix_character>*\n┃ *Examples: .setprefix !  or  .setprefix .* \n╰━━━━━━━━━━━━━━━┈`);
    }
});
