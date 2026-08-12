const { cmd, commands } = require("../NovaX_Mini");
const moment = require("moment-timezone");
const { fakevCard } = require('../lib/fakevCard');
const config = require('../config');
const { sendInteractive, qr, url, select } = require('../lib/interactive');

const { getLang } = require('../lib/lang');
const lang = getLang(config.LANGUAGE);

const CATEGORY_META = {
    download:  { emoji: "📥", name: "Downloads",   desc: "Download songs, videos & media" },
    search:    { emoji: "🤖", name: "AI",          desc: "AI-powered tools & search" },
    group:     { emoji: "👥", name: "Group",       desc: "Group management commands" },
    tools:     { emoji: "🛠️", name: "Tools",       desc: "Utility tools & services" },
    owner:     { emoji: "👑", name: "Owner",       desc: "Owner-only commands" },
    system:    { emoji: "⚙️", name: "System",      desc: "System info & core settings" },
    sticker:   { emoji: "🎭", name: "Sticker",     desc: "Sticker creation & formatting" },
    general:   { emoji: "🌐", name: "General",     desc: "General info & utilities" },
    main:      { emoji: "🏠", name: "Main",        desc: "Main bot status & info" },
    news:      { emoji: "📰", name: "News",        desc: "Latest news & updates" },
    adult:     { emoji: "🔞", name: "Adult",       desc: "18+ content" },
    misc:      { emoji: "✨", name: "Misc",        desc: "Miscellaneous commands" },
    fun:       { emoji: "🎮", name: "Fun",         desc: "Games, jokes & entertainment" },
    ai:        { emoji: "🤖", name: "AI",          desc: "Artificial intelligence tools" },
};

function getCatMeta(cat) {
    return CATEGORY_META[cat] || { emoji: "📋", name: cat.charAt(0).toUpperCase() + cat.slice(1), desc: "" };
}

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help"],
    desc: "Display all available bot commands with interactive menu",
    category: "system",
    react: "📋",
    filename: __filename,
}, async (conn,  mek,  m, { reply, pushname, args, body, command }) => {
    const from = mek.key.remoteJid;
    try {
        const prefix = config.PREFIX || ".";
        const time = moment().tz("Asia/Colombo").format("HH:mm:ss");
        const date = moment().tz("Asia/Colombo").format("DD/MM/YYYY");
        const botName = config.BOT_NAME || "NovaX Mini";
        const ownerNum = (config.OWNER_NUMBER || "").replace(/[^0-9]/g, "");
        const channelLink = config.CHANNEL_LINK || "https://whatsapp.com/channel/0029VbCZl6wBPzjczwuKpm1A";

        let totalCommands = 0;
        const grouped = {};
        for (const c of commands) {
            if (!c.pattern || !c.category || c.dontAddCommandList) continue;
            totalCommands++;
            const cat = c.category.toLowerCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(c);
        }

        const imgUrl = config.IMAGE_PATH || "https://files.catbox.moe/aeg27n.png";

        if (args && args.length > 0) {
            const selectedCategory = args.slice(1).join(" ").toLowerCase().trim() || args[0].toLowerCase().trim();
            const catCommands = grouped[selectedCategory];

            if (!catCommands || catCommands.length === 0) {
                const available = Object.keys(grouped).map(c => getCatMeta(c).emoji + " " + getCatMeta(c).name).join("\n");
                return reply(`╭━━━〔 *${lang.NOT_FOUND}* 〕━━━┈\n┃ Available categories:\n${available.split("\n").map(l => "┃ " + l).join("\n")}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
            }

            const meta = getCatMeta(selectedCategory);
            const cmdList = catCommands.map(c => `┃ ◈ ${prefix}${c.pattern}`).join("\n");

            const bodyText =
                `╭━━━〔 *${meta.name.toUpperCase()}* 〕━━━┈\n` +
                `┃ ${meta.emoji} ${meta.desc}\n` +
                `╰━━━━━━━━━━━━━━━┈\n\n` +
                `╭━━━〔 *${lang.MENU_CMDS.toUpperCase()}* 〕━━━┈\n` +
                `${cmdList}\n` +
                `┃ \n` +
                `┃ 📊 Total: *${catCommands.length}* commands\n` +
                `╰━━━━━━━━━━━━━━━┈`;

            const subButtons = [
                qr(`🔙 Back`, `${prefix}menu`),
                url(`👨‍💻 ${lang.MENU_OWNER}`, ownerNum ? `https://wa.me/${ownerNum}` : channelLink),
                url("🌐 Website", channelLink)
            ];

            return await sendInteractive(conn, from, mek, {
                imageUrl: imgUrl,
                title: `${meta.emoji} ${meta.name}`,
                subtitle: `${catCommands.length} commands available`,
                body: bodyText,
                buttons: subButtons,
                viewOnce: true
            });
        }

        const categories = Object.keys(grouped).sort();
        const rows = categories.map(cat => {
            const meta = getCatMeta(cat);
            const cmdCount = grouped[cat].length;
            const sampleCmds = grouped[cat].slice(0, 3).map(c => prefix + c.pattern).join(", ");
            return {
                title: `${meta.emoji} ${meta.name}`,
                description: `${cmdCount} commands • ${sampleCmds}${cmdCount > 3 ? "..." : ""}`,
                id: `${prefix}menu ${cat}`
            };
        });

        const sections = [{
            title: `⚡ ${botName} Commands`,
            rows: rows
        }];

        const bodyText =
            `╭━━━〔 *${lang.MENU_TITLE}* 〕━━━┈\n` +
            `┃ 👋 Hey *${pushname || "User"}*!\n` +
            `┃ Welcome to the command center.\n` +
            `╰━━━━━━━━━━━━━━━━━━┈\n\n` +
            `╭━━━〔 *SYSTEM INFO* 〕━━━┈\n` +
            `┃ 🕐 *Time:* ${time}\n` +
            `┃ 📅 *Date:* ${date}\n` +
            `┃ 📊 *Cmds:* ${totalCommands}\n` +
            `┃ 📁 *Cats:* ${categories.length}\n` +
            `┃ 🔤 *${lang.MENU_PREFIX}:* [ ${prefix} ]\n` +
            `╰━━━━━━━━━━━━━━━━━━━━┈\n\n` +
            `${lang.MENU_FOOTER}`;

        const mainButtons = [
            select("📋 Select Category", sections),
            qr("⚙️ Settings", `${prefix}mode`),
            url(`👨‍💻 ${lang.MENU_OWNER}`, ownerNum ? `https://wa.me/${ownerNum}` : channelLink),
            url("🌐 Website", channelLink)
        ];

        await sendInteractive(conn, from, mek, {
            imageUrl: imgUrl,
            title: `⚡ ${botName}`,
            subtitle: `Premium WhatsApp Bot • v${require('../package.json').version}`,
            body: bodyText,
            buttons: mainButtons,
            viewOnce: true
        });

    } catch (err) {
        console.error("AllMenu Error:", err);
        reply(`╭━━━〔 *${lang.ERROR} Error* 〕━━━┈\n┃ ⚠️ Failed to generate menu.\n┃ ${err.message}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
    }
});
