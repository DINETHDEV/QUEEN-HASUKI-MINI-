const { cmd } = require('../NovaX_Mini');
const config = require('../config');
const axios = require('axios');
const { sendInteractive, qr, url } = require('../lib/interactive');
const { getUserLanguage } = require('../lib/database');
const { t } = require('../lib/language');

function getWeatherEmoji(desc) {
    const d = desc.toLowerCase();
    if (d.includes('sunny') || d.includes('clear')) return '☀️';
    if (d.includes('partly cloudy')) return '⛅';
    if (d.includes('cloudy') || d.includes('overcast')) return '☁️';
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('fog') || d.includes('mist')) return '🌫️';
    if (d.includes('wind')) return '💨';
    return '🌡️';
}

function getHumidityEmoji(h) {
    const hum = parseInt(h);
    if (hum >= 80) return '💧💧💧';
    if (hum >= 60) return '💧💧';
    return '💧';
}

function getUVLabel(uv) {
    const u = parseInt(uv);
    if (u === 0) return 'None 🌙';
    if (u <= 2) return 'Low 🟢';
    if (u <= 5) return 'Moderate 🟡';
    if (u <= 7) return 'High 🟠';
    if (u <= 10) return 'Very High 🔴';
    return 'Extreme ☢️';
}

cmd({
    pattern: 'weather',
    alias: ['w', 'climate', 'temp'],
    react: '🌤️',
    desc: 'Get live weather info for any city',
    category: 'tools',
    use: '.weather <city name>',
    filename: __filename
}, async (conn,  mek,  m, { from, sender, q, text }) => {
    // Resolve per-user language
    let userLang = await getUserLanguage(sender);
    if (!userLang) userLang = (config.LANGUAGE || 'en').toLowerCase();

    try {
        const prefix = config.PREFIX || '.';

        if (!q) {
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *🌤️ ${t(userLang, 'weather', 'TITLE')}* 〕━━━┈\n┃ ${t(userLang, 'weather', 'USAGE')}\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('📋 Menu', `${prefix}menu`)]
            });
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const apiUrl = `https://www.movanest.xyz/v2/weather?city=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 15000 });
        const data = res.data;

        if (!data.status || !data.results) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return sendInteractive(conn, from, mek, {
                imageUrl: config.IMAGE_PATH,
                body: `╭━━━〔 *❌ Error* 〕━━━┈\n┃ *${t(userLang, 'weather', 'NOT_FOUND')}*\n╰━━━━━━━━━━━━━━━┈`,
                footer: config.BOT_FOOTER,
                buttons: [qr('🔄 Retry', `${prefix}weather ${q}`), qr('📋 Menu', `${prefix}menu`)]
            });
        }

        const w = data.results;
        const weatherEmoji = getWeatherEmoji(w.weather_desc);
        const humidityEmoji = getHumidityEmoji(w.humidity);
        const uvLabel = getUVLabel(w.uv_index);
        const tempC = parseInt(w.temperature_C);
        const tempBar = tempC >= 35 ? '🔥🔥🔥' : tempC >= 25 ? '🌡️🔆' : tempC >= 15 ? '🌡️🆒' : '🥶❄️';

        const body =
            `╭━━━〔 ${weatherEmoji} *${t(userLang, 'weather', 'REPORT')}* 〕━━━┈\n` +
            `┃ 📍 *${t(userLang, 'weather', 'LOCATION')}:* ${w.location_name}, ${w.country}\n` +
            `┃ 🕒 *${t(userLang, 'weather', 'OBSERVED')}:* ${w.observation_time}\n` +
            `┃ ━━━━━━━━━━━━━━━━━━━━━━\n` +
            `┃ ${weatherEmoji} *${t(userLang, 'weather', 'CONDITION')}:* ${w.weather_desc}\n` +
            `┃ 🌡️ *${t(userLang, 'weather', 'TEMPERATURE')}:* ${w.temperature_C}°C ${tempBar}\n` +
            `┃ 🤔 *${t(userLang, 'weather', 'FEELS_LIKE')}:* ${w.feels_like_C}°C\n` +
            `┃ ━━━━━━━━━━━━━━━━━━━━━━\n` +
            `┃ ${humidityEmoji} *${t(userLang, 'weather', 'HUMIDITY')}:* ${w.humidity}%\n` +
            `┃ 💨 *${t(userLang, 'weather', 'WIND')}:* ${w.wind_kmph} km/h (${w.wind_dir})\n` +
            `┃ ☀️ *${t(userLang, 'weather', 'UV_INDEX')}:* ${w.uv_index} — ${uvLabel}\n` +
            `╰━━━━━━━━━━━━━━━┈`;

        await sendInteractive(conn, from, mek, {
            imageUrl: `https://wttr.in/${encodeURIComponent(q)}_2.png`,
            body,
            footer: config.BOT_FOOTER,
            buttons: [
                qr(t(userLang, 'weather', 'REFRESH_BTN'), `${prefix}weather ${q}`),
                url(t(userLang, 'weather', 'MAPS_BTN'), `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.location_name + ', ' + w.country)}`),
                qr('📋 Menu', `${prefix}menu`)
            ]
        });

        await conn.sendMessage(from, { react: { text: weatherEmoji, key: mek.key } });

    } catch (err) {
        console.error('WEATHER ERROR:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        const prefix = config.PREFIX || '.';
        sendInteractive(conn, from, mek, {
            imageUrl: config.IMAGE_PATH,
            body: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *${t(userLang, 'weather', 'FAILED')}*\n┃ Error: ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
            footer: config.BOT_FOOTER,
            buttons: [qr('📋 Menu', `${prefix}menu`)]
        });
    }
});
