const axios = require('axios');
const config = require('../config');
const cheerio = require('cheerio');
const { cmd } = require('../NovaX_Mini');

async function searchPastPapers(query) {
    try {
        const searchUrl = `https://pastpaper.lk/?s=${encodeURIComponent(query)}`;
        const res = await axios.get(searchUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const $ = cheerio.load(res.data);
        const results = [];

        
        $('article, .post, .entry, .item-post').each((i, el) => {
            if (i >= 8) return false; // max 8 results
            const title = $(el).find('h2 a, h3 a, .entry-title a, .post-title a').first().text().trim();
            const link  = $(el).find('h2 a, h3 a, .entry-title a, .post-title a').first().attr('href');
            const desc  = $(el).find('.entry-summary, .entry-content, .post-excerpt, p').first().text().trim().slice(0, 100);
            if (title && link) results.push({ title, link, desc });
        });

 
        if (results.length === 0) {
            $('a').each((i, el) => {
                const href  = $(el).attr('href') || '';
                const text  = $(el).text().trim();
                const lc    = text.toLowerCase();
                if (
                    href.includes('pastpaper.lk') &&
                    text.length > 8 &&
                    (lc.includes('paper') || lc.includes('past') || lc.includes('exam') || lc.includes('grade') || lc.includes('a/l') || lc.includes('o/l'))
                ) {
                    if (results.length < 8) results.push({ title: text, link: href, desc: '' });
                }
            });
        }

        return results;
    } catch (err) {
        console.error('PASTPAPER SEARCH ERROR:', err.message);
        return [];
    }
}

// guru.lk eka fallback search
async function searchGuruLk(query) {
    try {
        const searchUrl = `https://guru.lk/search/?q=${encodeURIComponent(query + ' past paper')}`;
        const res = await axios.get(searchUrl, {
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(res.data);
        const results = [];

        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            const lc   = (href + text).toLowerCase();
            if (
                text.length > 10 &&
                (lc.includes('paper') || lc.includes('past') || lc.includes('exam')) &&
                href.startsWith('http') &&
                results.length < 5
            ) {
                results.push({ title: text, link: href, desc: '' });
            }
        });

        return results;
    } catch (err) {
        return [];
    }
}

// ─── Subject aliases normalize කරනවා ──────────────────────────
const SUBJECT_MAP = {
    'bio'         : 'biology',
    'chem'        : 'chemistry',
    'phy'         : 'physics',
    'phys'        : 'physics',
    'math'        : 'mathematics',
    'maths'       : 'mathematics',
    'cm'          : 'combined maths',
    'combmaths'   : 'combined maths',
    'combined'    : 'combined maths',
    'hist'        : 'history',
    'eng'         : 'english',
    'sin'         : 'sinhala',
    'econ'        : 'economics',
    'acc'         : 'accounting',
    'ict'         : 'ICT',
    'it'          : 'ICT',
    'commerce'    : 'business studies',
    'bs'          : 'business studies',
    'geo'         : 'geography',
};

function normalizeSubject(raw) {
    const lower = raw.toLowerCase().trim();
    return SUBJECT_MAP[lower] || lower;
}

// ─── Grade/Level keyword detect කරනවා ─────────────────────────
function detectLevel(tokens) {
    for (const t of tokens) {
        const lc = t.toLowerCase();
        if (['al', 'a/l', 'alevel', 'a-level', 'advanced'].includes(lc)) return 'A/L';
        if (['ol', 'o/l', 'olevel', 'o-level', 'ordinary'].includes(lc)) return 'O/L';
        if (lc.startsWith('grade') || /^g\d+$/.test(lc)) return t.toUpperCase();
        if (/^\d{4}$/.test(t)) return null; // year
    }
    return null;
}

function detectYear(tokens) {
    for (const t of tokens) {
        if (/^\d{4}$/.test(t) && parseInt(t) >= 2000 && parseInt(t) <= 2030) return t;
    }
    return null;
}

// ════════════════════════════════════════════
//  📚 COMMAND — pastpaper / pp
// ════════════════════════════════════════════
cmd({
    pattern: 'pastpaper',
    alias: ['pp', 'paper', 'pastpapers'],
    desc: 'Sri Lanka Past Papers Search & Download Links',
    category: 'education',
    react: '📚',
    use: '.pastpaper <subject> [year/level]',
    filename: __filename
},
async (conn,  mek,  m, { q, text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        // ── Usage check ──────────────────────────────────────────
        if (!text || text.trim().length < 2) {
            return reply(
`╭━━━〔 *📚 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *PAST PAPER DOWNLOADER*
┃
┃ *Usage:*
┃ _.pastpaper <subject> [year/level]_
┃
┃ *Examples:*
┃ 📌 .pastpaper biology 2023
┃ 📌 .pastpaper maths al
┃ 📌 .pastpaper physics o/l
┃ 📌 .pastpaper chemistry 2022 al
┃ 📌 .pastpaper sinhala
┃
┃ *Subjects:*
┃ biology, chemistry, physics, maths,
┃ combined maths, history, english,
┃ sinhala, economics, accounting, ICT,
┃ geography, business studies
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`
            );
        }

        // ── Parse input ──────────────────────────────────────────
        const tokens  = text.trim().split(/\s+/);
        const year    = detectYear(tokens);
        const level   = detectLevel(tokens);

        // subject = year/level නොවෙන tokens
        const subjectTokens = tokens.filter(t => {
            if (year && t === year) return false;
            const lc = t.toLowerCase();
            if (['al','a/l','alevel','a-level','advanced','ol','o/l','olevel','o-level','ordinary'].includes(lc)) return false;
            if (lc.startsWith('grade') || /^g\d+$/.test(lc)) return false;
            return true;
        });

        const rawSubject = subjectTokens.join(' ').trim() || tokens[0];
        const subject    = normalizeSubject(rawSubject);

        // ── Build search query ───────────────────────────────────
        let query = subject;
        if (level) query += ` ${level}`;
        if (year)  query += ` ${year}`;
        query += ' past paper';

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // ── Search pastpaper.lk ──────────────────────────────────
        let results = await searchPastPapers(query);

        // fallback — guru.lk
        if (results.length === 0) {
            results = await searchGuruLk(`${subject} ${level || ''} ${year || ''}`);
        }

        // ── Build header ─────────────────────────────────────────
        const headerParts = [subject.toUpperCase()];
        if (level) headerParts.push(level);
        if (year)  headerParts.push(year);
        const header = headerParts.join(' ');

        // ── Build reply message ──────────────────────────────────
        if (results.length === 0) {
            // Direct links ලිස්ට් ෙකරනවා, search ework නොවුනත්
            const fallbackMsg =
`╭━━━〔 *📚 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *${header} PAST PAPERS*
┃
┃ ⚠️ No direct results found.
┃ Use these official sites:
┃
┃ 🌐 *PastPaper.lk:*
┃ https://pastpaper.lk/?s=${encodeURIComponent(subject + (year ? ' ' + year : '') + (level ? ' ' + level : ''))}
┃
┃ 🌐 *Guru.lk:*
┃ https://guru.lk/search/?q=${encodeURIComponent(subject + ' past paper ' + (year || '') + ' ' + (level || ''))}
┃
┃ 🌐 *DOE Official:*
┃ https://www.doenets.lk/exam/g_Past_Papers.aspx
┃
┃ 🌐 *E-Thaksalawa:*
┃ https://www.e-thaksalawa.moe.gov.lk
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(fallbackMsg);
        }

        // ── Format results list ──────────────────────────────────
        let resultLines = '';
        results.forEach((r, i) => {
            resultLines += `┃ ${i + 1}. 📄 *${r.title}*\n`;
            resultLines += `┃    🔗 ${r.link}\n`;
            if (r.desc) resultLines += `┃    📝 ${r.desc.slice(0, 80)}...\n`;
            resultLines += '┃\n';
        });

        const replyMsg =
`╭━━━〔 *📚 ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *${header} PAST PAPERS*
┃ 📊 *Found: ${results.length} results*
┃
${resultLines}┃ ─────────────────────────
┃ 🌐 *More at:*
┃ https://pastpaper.lk/?s=${encodeURIComponent(subject + (year ? ' ' + year : '') + (level ? ' ' + level : ''))}
┃ https://www.doenets.lk/exam/g_Past_Papers.aspx
╰━━━━━━━━━━━━━━━┈
> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        await reply(replyMsg);

    } catch (err) {
        console.error('PASTPAPER ERROR:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(
`╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈
┃ *Past paper search failed!*
┃ Try again or visit:
┃ https://pastpaper.lk
╰━━━━━━━━━━━━━━━┈`
        );
    }
});
