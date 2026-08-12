
const axios = require("axios");
const { cmd } = require("../NovaX_Mini");

const RAPIDAPI_KEY = "7e04d54eb9msh084eca649bae8d5p199e67jsnddc8c368f526";

cmd({
    pattern: "cricketer",
    alias: ["icc", "cr"],
    react: "🏏",
    desc: "ICC Player Rankings",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    const from = mek.key.remoteJid;
    try {

        const { data } = await axios.get(
            "https://cricket-live-line1.p.rapidapi.com/playerRanking/1",
            {
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": "cricket-live-line1.p.rapidapi.com"
                }
            }
        );

        if (!data || !data.data) {
            return reply("❌ No ranking data found.");
        }

        let text = "🏏 *ICC Player Rankings*\n\n";

        data.data.slice(0, 10).forEach((player, i) => {
            text += `${i + 1}. ${player.player_name || player.name}\n`;
            text += `🌍 ${player.country || "-"}\n`;
            text += `⭐ Rating: ${player.rating || "-"}\n\n`;
        });

        return reply(text);

    } catch (err) {
        console.log(err.response?.data || err.message);
        return reply("❌ Failed to fetch rankings.");
    }
});
