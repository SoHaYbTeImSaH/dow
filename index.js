const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// ایجاد سرور Express
const app = express();
const port = process.env.PORT || 3000;

// تنظیمات ربات تلگرام
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN', {polling: true});

// تنظیمات API اینستاگرام
const INSTAGRAM_API = {
    username: 'shmohmdi',
    password: 'dsHLdXye8WKvc50OIV3xr',
    baseUrl: 'https://boxapi.ir/api/instagram'
};

// استخراج ID از لینک اینستاگرام
function extractInstagramId(url) {
    const regex = /\/p\/([^/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// دریافت اطلاعات مدیا از API
async function getMediaInfo(mediaId) {
    try {
        const response = await axios.post(
            `${INSTAGRAM_API.baseUrl}/media/get_info`,
            { id: mediaId },
            {
                auth: {
                    username: INSTAGRAM_API.username,
                    password: INSTAGRAM_API.password
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching media info:', error);
        throw error;
    }
}

// دانلود و ارسال ویدیو
async function downloadAndSendVideo(chatId, videoUrl) {
    try {
        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream'
        });

        await bot.sendVideo(chatId, response.data);
    } catch (error) {
        console.error('Error downloading/sending video:', error);
        throw error;
    }
}

// دستور شروع
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'سلام! لطفاً لینک پست اینستاگرام را ارسال کنید.');
});

// پردازش پیام‌های دریافتی
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('https://www.instagram.com/')) {
        try {
            const mediaId = extractInstagramId(text);
            if (!mediaId) {
                bot.sendMessage(chatId, 'لینک نامعتبر است. لطفاً یک لینک معتبر اینستاگرام ارسال کنید.');
                return;
            }

            bot.sendMessage(chatId, 'در حال دریافت اطلاعات ویدیو...');
            const mediaInfo = await getMediaInfo(mediaId);

            if (mediaInfo && mediaInfo.video_url) {
                bot.sendMessage(chatId, 'در حال دانلود و ارسال ویدیو...');
                await downloadAndSendVideo(chatId, mediaInfo.video_url);
                bot.sendMessage(chatId, 'ویدیو با موفقیت ارسال شد!');
            } else {
                bot.sendMessage(chatId, 'متأسفانه ویدیویی در این پست یافت نشد.');
            }
        } catch (error) {
            bot.sendMessage(chatId, 'متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.');
            console.error('Error:', error);
        }
    } else if (!text.startsWith('/')) {
        bot.sendMessage(chatId, 'لطفاً یک لینک معتبر اینستاگرام ارسال کنید.');
    }
});

// راه‌اندازی سرور وب
app.get('/', (req, res) => {
    res.send('Instagram Downloader Bot is running!');
});

app.listen(port, () => {
    console.log(`Bot is running on port ${port}...`);
});