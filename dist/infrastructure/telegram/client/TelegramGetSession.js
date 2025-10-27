"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
require("dotenv").config();
const input = require("input"); // npm install input
const apiId = parseInt(process.env.TELEGRAM_API_ID0);
const apiHash = process.env.TELEGRAM_API_HASH0;
const stringSession = new sessions_1.StringSession(""); // Store session string after login
(async () => {
    console.log("⚙️ Starting Telegram client...");
    const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("📞 Enter your phone number: "),
        password: async () => await input.text("🔑 Enter 2FA password (if any): "),
        phoneCode: async () => await input.text("📨 Enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("✅ Logged in successfully!");
    console.log("Your session string (save this):", client.session.save());
    await client.disconnect();
})();
