const { cmd } = require('../NovaX_Mini');

cmd({
    pattern: "online",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online in the group (Admins & Owner only)",
    category: "main",
    react: "🟢",
    filename: __filename
},
async (conn,  mek,  m, { quoted, command, text, isGroup, groupMetadata, participants, isAdmins, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!isGroup) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command can only be used in groups!*\n╰━━━━━━━━━━━━━━━┈`);

        if (!isCreator && !isAdmins && !fromMe) {
            return reply(`╭━━━〔 *🔒 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *This command is for Owner & Admins only!*\n╰━━━━━━━━━━━━━━━┈`);
        }

        await reply(`╭━━━〔 *🟢 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Fetching online members...*\n┃ *Please wait a moment!*\n╰━━━━━━━━━━━━━━━┈`);

        const onlineMembers = new Set();
        const groupData = await conn.groupMetadata(from);
        const presencePromises = [];

        for (const participant of groupData.participants) {
            presencePromises.push(
                conn.presenceSubscribe(participant.id)
                    .then(() => {
                        return conn.sendPresenceUpdate('composing', participant.id);
                    })
            );
        }

        await Promise.all(presencePromises);

        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineMembers.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        const checks = 3;
        const checkInterval = 5000;
        let checksDone = 0;

        const checkOnline = async () => {
            checksDone++;
            
            if (checksDone >= checks) {
                clearInterval(interval);
                conn.ev.off('presence.update', presenceHandler);
                
                if (onlineMembers.size === 0) {
                    return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No online members detected.*\n┃ *They may be hiding their presence.*\n╰━━━━━━━━━━━━━━━┈`);
                }
                
                const onlineArray = Array.from(onlineMembers);
                const onlineList = onlineArray.map((member, index) => 
                    `┃ ${index + 1}. @${member.split('@')[0]}`
                ).join('\n');
                
                const message = `╭━━━〔 *🟢 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Online Members* (${onlineArray.length}/${groupData.participants.length})\n┃\n${onlineList}\n╰━━━━━━━━━━━━━━━┈`;
                
                await conn.sendMessage(from, { 
                    text: message,
                    mentions: onlineArray
                }, { quoted: mek });
            }
        };

        const interval = setInterval(checkOnline, checkInterval);

    } catch (e) {
        console.error("Error in online command:", e);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *An error occurred: ${e.message}*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
