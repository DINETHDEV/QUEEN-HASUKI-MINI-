const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');

// ════════════════════════════════════════════
//  🤖 GPT-3.5 AI
// ════════════════════════════════════════════
cmd({
    pattern: "gpt",
    alias: ["gpt3", "chatgpt"],
    react: "🤖",
    desc: "Chat with GPT-3.5 AI",
    category: "ai",
    use: ".gpt <message>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .gpt hello\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "💬", key: mek.key } });
        const res = await axios.get(`https://gpt-3-5.apis-bj-devs.workers.dev/?prompt=${encodeURIComponent(q)}`, { timeout: 30000 });
        const answer = res.data?.response || res.data?.result || res.data?.message || JSON.stringify(res.data);
        await reply(`╭━━━〔 *🤖 ɢᴘᴛ-3.5* 〕━━━┈\n┃ ${answer}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("GPT ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *GPT-3.5 error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  ✨ GEMINI AI (BJ)
// ════════════════════════════════════════════
cmd({
    pattern: "bjgemini",
    alias: ["gemini2", "geminiai"],
    react: "✨",
    desc: "Chat with Gemini 1.5 Flash AI",
    category: "ai",
    use: ".bjgemini <message>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .bjgemini hello\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "💬", key: mek.key } });
        const res = await axios.get(`https://gemini-1-5-flash.bjcoderx.workers.dev/?text=${encodeURIComponent(q)}`, { timeout: 30000 });
        const answer = res.data?.response || res.data?.result || res.data?.message || res.data?.text || JSON.stringify(res.data);
        await reply(`╭━━━〔 *✨ ɢᴇᴍɪɴɪ ᴀɪ* 〕━━━┈\n┃ ${answer}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("BJ GEMINI ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Gemini AI error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🔮 DEEPSEEK AI
// ════════════════════════════════════════════
cmd({
    pattern: "deepseek",
    alias: ["deep", "dsai"],
    react: "🔮",
    desc: "Chat with DeepSeek AI",
    category: "ai",
    use: ".deepseek <message>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .deepseek hello\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "💬", key: mek.key } });
        const res = await axios.get(`https://deepseek-ai.apis-bj-devs.workers.dev/?text=${encodeURIComponent(q)}`, { timeout: 30000 });
        const answer = res.data?.response || res.data?.result || res.data?.message || res.data?.text || JSON.stringify(res.data);
        await reply(`╭━━━〔 *🔮 ᴅᴇᴇᴘsᴇᴇᴋ ᴀɪ* 〕━━━┈\n┃ ${answer}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("DEEPSEEK ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *DeepSeek AI error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🧠 QWEN AI
// ════════════════════════════════════════════
cmd({
    pattern: "qwen",
    alias: ["qwenai"],
    react: "🧠",
    desc: "Chat with Qwen AI",
    category: "ai",
    use: ".qwen <message>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .qwen hello\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "💬", key: mek.key } });
        const res = await axios.get(`https://qwen-ai.apis-bj-devs.workers.dev/?text=${encodeURIComponent(q)}`, { timeout: 30000 });
        const answer = res.data?.response || res.data?.result || res.data?.message || res.data?.text || JSON.stringify(res.data);
        await reply(`╭━━━〔 *🧠 ǫᴡᴇɴ ᴀɪ* 〕━━━┈\n┃ ${answer}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("QWEN ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Qwen AI error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});


// ════════════════════════════════════════════
//  🖼️ TEXT TO IMAGE
// ════════════════════════════════════════════
cmd({
    pattern: "txt2img",
    alias: ["imagine", "textimg", "genimg"],
    react: "🎨",
    desc: "Generate image from text",
    category: "ai",
    use: ".txt2img <prompt>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .txt2img cute girl\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
        await reply(`╭━━━〔 *🎨 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Generating your image...*\n╰━━━━━━━━━━━━━━━┈`);
        const imgUrl = `https://text-to-img.apis-bj-devs.workers.dev/?prompt=${encodeURIComponent(q)}`;
        await conn.sendMessage(from, { image: { url: imgUrl }, caption: `╭━━━〔 *🎨 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Prompt:* ${q}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("TXT2IMG ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Image generation failed!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🌊 DIFFUSION AI IMAGE
// ════════════════════════════════════════════
cmd({
    pattern: "diffusion",
    alias: ["diff", "aiart", "sdimage"],
    react: "🌊",
    desc: "Generate image with Diffusion AI",
    category: "ai",
    use: ".diffusion <prompt>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .diffusion a cute baby\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🌊", key: mek.key } });
        await reply(`╭━━━〔 *🌊 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Generating diffusion art...*\n╰━━━━━━━━━━━━━━━┈`);
        const imgUrl = `https://diffusion-ai.bjcoderx.workers.dev/?prompt=${encodeURIComponent(q)}`;
        await conn.sendMessage(from, { image: { url: imgUrl }, caption: `╭━━━〔 *🌊 ᴅɪꜰꜰᴜsɪᴏɴ ᴀɪ* 〕━━━┈\n┃ *Prompt:* ${q}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("DIFFUSION ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Diffusion AI error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🔍 PINTEREST SEARCH
// ════════════════════════════════════════════
cmd({
    pattern: "pinterest",
    alias: ["pin", "pinimg"],
    react: "📌",
    desc: "Search images on Pinterest",
    category: "search",
    use: ".pinterest <query>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .pinterest Anime\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const res = await axios.get(`https://pinterest-search.apis-bj-devs.workers.dev/?search=${encodeURIComponent(q)}&limit=5`, { timeout: 30000 });
        const images = res.data?.results || res.data?.images || res.data;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No images found!*\n╰━━━━━━━━━━━━━━━┈`);
        }
        for (const img of images.slice(0, 5)) {
            const imgUrl = typeof img === 'string' ? img : img?.url || img?.image || img?.src;
            if (imgUrl) await conn.sendMessage(from, { image: { url: imgUrl }, caption: `📌 *Pinterest* | ${q}` }, { quoted: mek });
        }
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("PINTEREST ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Pinterest search error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🔎 GOOGLE SEARCH
// ════════════════════════════════════════════
cmd({
    pattern: "google",
    alias: ["gsearch", "googlesearch"],
    react: "🔎",
    desc: "Search on Google",
    category: "search",
    use: ".google <query>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .google cats\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const res = await axios.get(`https://google-search.bjcoderx.workers.dev/?q=${encodeURIComponent(q)}`, { timeout: 30000 });
        const results = res.data?.results || res.data?.data || res.data;
        if (!results || !Array.isArray(results) || results.length === 0) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No results found!*\n╰━━━━━━━━━━━━━━━┈`);
        }
        let msg = `╭━━━〔 *🔎 ɢᴏᴏɢʟᴇ sᴇᴀʀᴄʜ* 〕━━━┈\n┃ *Query:* ${q}\n┃\n`;
        results.slice(0, 5).forEach((r, i) => {
            const title = r?.title || r?.name || "No title";
            const link = r?.link || r?.url || r?.href || "";
            const desc = r?.description || r?.snippet || "";
            msg += `┃ *${i + 1}.* ${title}\n┃ 🔗 ${link}\n┃ 📝 ${desc.slice(0, 80)}...\n┃\n`;
        });
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("GOOGLE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Google search error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🔵 BING SEARCH
// ════════════════════════════════════════════
cmd({
    pattern: "bing",
    alias: ["bingsearch"],
    react: "🔵",
    desc: "Search on Bing",
    category: "search",
    use: ".bing <query>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .bing cats\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const res = await axios.get(`https://bing-search.apis-bj-devs.workers.dev/?search=${encodeURIComponent(q)}&limit=5`, { timeout: 30000 });
        const results = res.data?.results || res.data?.data || res.data;
        if (!results || !Array.isArray(results) || results.length === 0) {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *No results found!*\n╰━━━━━━━━━━━━━━━┈`);
        }
        let msg = `╭━━━〔 *🔵 ʙɪɴɢ sᴇᴀʀᴄʜ* 〕━━━┈\n┃ *Query:* ${q}\n┃\n`;
        results.slice(0, 5).forEach((r, i) => {
            const title = r?.title || r?.name || "No title";
            const link = r?.link || r?.url || r?.href || "";
            const desc = r?.description || r?.snippet || "";
            msg += `┃ *${i + 1}.* ${title}\n┃ 🔗 ${link}\n┃ 📝 ${desc.slice(0, 80)}...\n┃\n`;
        });
        msg += `╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("BING ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Bing search error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});


// ════════════════════════════════════════════
//  🌍 TRANSLATOR
// ════════════════════════════════════════════
cmd({
    pattern: "translate",
    alias: ["tr", "trans"],
    react: "🌍",
    desc: "Translate text to any language",
    category: "tools",
    use: ".translate <to> <text>  e.g. .translate ur hello",
    filename: __filename
}, async (conn,  mek,  m, { args, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (args.length < 2) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .translate ur hello brother\n┃ *Langs:* en, ur, si, hi, ar, fr, es...\n╰━━━━━━━━━━━━━━━┈`);
        const toLang = args[0];
        const text = args.slice(1).join(' ');
        await conn.sendMessage(from, { react: { text: "🌍", key: mek.key } });
        const res = await axios.get(`https://translator.bjcoderx.workers.dev/?text=${encodeURIComponent(text)}&fr=en&to=${toLang}`, { timeout: 30000 });
        const translated = res.data?.translated || res.data?.result || res.data?.text || JSON.stringify(res.data);
        await reply(`╭━━━〔 *🌍 ᴛʀᴀɴsʟᴀᴛᴏʀ* 〕━━━┈\n┃ *Original:* ${text}\n┃ *Translated (${toLang}):* ${translated}\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("TRANSLATE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Translation error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🌐 COUNTRY INFORMATION
// ════════════════════════════════════════════
cmd({
    pattern: "country",
    alias: ["countryinfo", "nation"],
    react: "🌐",
    desc: "Get information about a country",
    category: "tools",
    use: ".country <name>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .country India\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "🌐", key: mek.key } });
        const res = await axios.get(`https://countrys-information.apis-bj-devs.workers.dev/?name=${encodeURIComponent(q)}`, { timeout: 30000 });
        const d = res.data?.result || res.data?.data || res.data;
        const info = Array.isArray(d) ? d[0] : d;
        if (!info) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Country not found!*\n╰━━━━━━━━━━━━━━━┈`);
        const msg = `╭━━━〔 *🌐 ᴄᴏᴜɴᴛʀʏ ɪɴꜰᴏ* 〕━━━┈
┃ 🏳️ *Name:* ${info.name?.common || info.name || q}
┃ 🗺️ *Region:* ${info.region || 'N/A'}
┃ 🏙️ *Capital:* ${Array.isArray(info.capital) ? info.capital[0] : info.capital || 'N/A'}
┃ 👥 *Population:* ${info.population?.toLocaleString() || 'N/A'}
┃ 💰 *Currency:* ${info.currencies ? Object.values(info.currencies).map(c => c.name).join(', ') : 'N/A'}
┃ 📞 *Calling Code:* +${info.idd?.root || 'N/A'}
┃ 🌏 *Timezone:* ${info.timezones?.[0] || 'N/A'}
╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("COUNTRY ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Country info error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  📡 IP INFORMATION
// ════════════════════════════════════════════
cmd({
    pattern: "ipinfo",
    alias: ["ip", "iplookup"],
    react: "📡",
    desc: "Get information about an IP address",
    category: "tools",
    use: ".ipinfo <ip>",
    filename: __filename
}, async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .ipinfo 8.8.8.8\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });
        const res = await axios.get(`https://ip-info.bjcoderx.workers.dev/?ip=${encodeURIComponent(q)}`, { timeout: 30000 });
        const d = res.data?.result || res.data?.data || res.data;
        const msg = `╭━━━〔 *📡 ɪᴘ ɪɴꜰᴏ* 〕━━━┈
┃ 🌐 *IP:* ${d?.ip || q}
┃ 🏳️ *Country:* ${d?.country || d?.country_name || 'N/A'}
┃ 🏙️ *City:* ${d?.city || 'N/A'}
┃ 📍 *Region:* ${d?.region || 'N/A'}
┃ 🕐 *Timezone:* ${d?.timezone || 'N/A'}
┃ 📡 *ISP:* ${d?.org || d?.isp || 'N/A'}
╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}`;
        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("IP INFO ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *IP lookup error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  ✨ IMAGE ENHANCE
// ════════════════════════════════════════════
cmd({
    pattern: "enhance",
    alias: ["imgenhance", "upscale"],
    react: "✨",
    desc: "Enhance/upscale an image (reply to image)",
    category: "tools",
    use: ".enhance (reply to image)",
    filename: __filename
}, async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || mek.message?.imageMessage;
        if (!imageMsg) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Reply to an image with .enhance*\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "✨", key: mek.key } });
        const imgUrl = imageMsg.url || imageMsg.directPath;
        const res = await axios.get(`https://image-enhance.apis-bj-devs.workers.dev/?imageurl=${encodeURIComponent(imgUrl)}`, { timeout: 60000 });
        const enhancedUrl = res.data?.result || res.data?.url || res.data?.image || res.data;
        if (!enhancedUrl || typeof enhancedUrl !== 'string') {
            return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Could not enhance image!*\n╰━━━━━━━━━━━━━━━┈`);
        }
        await conn.sendMessage(from, { image: { url: enhancedUrl }, caption: `╭━━━〔 *✨ ɪᴍᴀɢᴇ ᴇɴʜᴀɴᴄᴇᴅ* 〕━━━┈\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("ENHANCE ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Image enhance error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  🎵 SPOTIFY DOWNLOADER
// ════════════════════════════════════════════
cmd({
    pattern: "spotify",
    alias: ["spot", "spdl"],
    react: "🎵",
    desc: "Download Spotify track",
    category: "download",
    use: ".spotify <spotify track url>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q || !q.includes('spotify.com')) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .spotify https://open.spotify.com/track/...\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply(`╭━━━〔 *🎵 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Downloading Spotify track...*\n╰━━━━━━━━━━━━━━━┈`);
        const res = await axios.get(`https://spotify-down.apis-bj-devs.workers.dev/?url=${encodeURIComponent(q)}`, { timeout: 60000 });
        const d = res.data?.result || res.data?.data || res.data;
        const audioUrl = d?.download || d?.url || d?.audio || d?.link;
        const title = d?.title || d?.name || "Spotify Track";
        const artist = d?.artist || d?.artists || "";
        const cover = d?.cover || d?.thumbnail || d?.image;
        if (!audioUrl) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Could not download track!*\n╰━━━━━━━━━━━━━━━┈`);
        if (cover) {
            await conn.sendMessage(from, { image: { url: cover }, caption: `╭━━━〔 *🎵 sᴘᴏᴛɪꜰʏ* 〕━━━┈\n┃ *Title:* ${title}\n┃ *Artist:* ${artist}\n┃ *Sending audio...*\n╰━━━━━━━━━━━━━━━┈` }, { quoted: mek });
        }
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: false }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("SPOTIFY ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Spotify download error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});

// ════════════════════════════════════════════
//  📲 TELEGRAM STORY DOWNLOADER
// ════════════════════════════════════════════
cmd({
    pattern: "tgstory",
    alias: ["tgdl", "telestory"],
    react: "📲",
    desc: "Download Telegram story",
    category: "download",
    use: ".tgstory <t.me/username>",
    filename: __filename
}, async (conn,  mek,  m, { quoted, q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        if (!q) return reply(`╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Example:* .tgstory t.me/username\n╰━━━━━━━━━━━━━━━┈`);
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const res = await axios.get(`https://tgstory-down.apis-bj-devs.workers.dev/?url=${encodeURIComponent(q)}`, { timeout: 60000 });
        const d = res.data?.result || res.data?.data || res.data;
        const mediaUrl = d?.url || d?.download || d?.video || d?.image;
        if (!mediaUrl) return reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Could not download story!*\n╰━━━━━━━━━━━━━━━┈`);
        const isVideo = mediaUrl.includes('.mp4') || d?.type === 'video';
        if (isVideo) {
            await conn.sendMessage(from, { video: { url: mediaUrl }, caption: `╭━━━〔 *📲 ᴛɢ sᴛᴏʀʏ* 〕━━━┈\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}` }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: { url: mediaUrl }, caption: `╭━━━〔 *📲 ᴛɢ sᴛᴏʀʏ* 〕━━━┈\n╰━━━━━━━━━━━━━━━┈\n> ${config.BOT_FOOTER}` }, { quoted: mek });
        }
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (err) {
        console.error("TGSTORY ERROR:", err.message);
        reply(`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Telegram story download error!*\n╰━━━━━━━━━━━━━━━┈`);
    }
});
