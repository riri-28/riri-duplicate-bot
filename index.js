require("dotenv").config();
const photo = require("./photo");
const dist = require("sharp-phash/distance");
const { Telegraf } = require("telegraf");
const express = require("express"); // NEW: The fake website builder

// Initialize bot
const { BOT_TOKEN } = process.env;
const bot = new Telegraf(BOT_TOKEN);

// TEMPORARY MEMORY
const chatMemory = new Map();

// ---------------------------------------------------------
// 🌐 THE HEARTBEAT SERVER (Keeps the cloud happy)
// ---------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ---------------------------------------------------------
// 🤖 THE BOT LOGIC
// ---------------------------------------------------------

bot.on("message", async (ctx) => {
    const { message: msg } = ctx;

    // IGNORE NON-PHOTOS
    if (!msg.photo) return;

    try {
        const filePath = await photo.getFileUrl(msg.photo[0].file_id);
        const fileDownloadUrl = photo.getFileDownloadUrl(filePath);
        const currentPhash = await photo.getImagePHash(fileDownloadUrl);
        
        const chatId = msg.chat.id;
        if (!chatMemory.has(chatId)) {
            chatMemory.set(chatId, []);
        }
        
        const history = chatMemory.get(chatId);
        let isDuplicate = false;

        for (const savedImage of history) {
            // SENSITIVITY SETTING: 12 allows for slight differences (cropping)
            const distance = await dist(savedImage.phash, currentPhash);
            if (distance <= 12) {
                isDuplicate = true;
                break;
            }
        }

        if (isDuplicate) {
            await ctx.reply("⚠️ **Duplicate Photo Detected!**", { 
                reply_to_message_id: msg.message_id, 
                parse_mode: "Markdown" 
            });
        } else {
            history.push({ phash: currentPhash, date: Date.now() });
        }

    } catch (e) {
        console.error("Error processing photo:", e.message);
    }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));