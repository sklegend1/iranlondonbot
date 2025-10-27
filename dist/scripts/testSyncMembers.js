"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const syncTargetGroupMembers_1 = require("../infrastructure/telegram/client/syncTargetGroupMembers");
(async () => {
    const apiId = Number(process.env.TELEGRAM_API_ID0);
    const apiHash = process.env.TELEGRAM_API_HASH0;
    const stringSession = new sessions_1.StringSession(process.env.TELEGRAM_STRING_SESSION0);
    const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    console.log("Connecting to Telegram...");
    await client.connect();
    const targetGroupKey = "iranian_london23"; // unique key for your reference
    const targetGroupUsername = "@iranian_london23"; // unique key for your reference";
    console.log(`Syncing members for ${targetGroupUsername}...`);
    await (0, syncTargetGroupMembers_1.syncTargetGroupMembers)(client, targetGroupKey, targetGroupUsername);
    console.log("✅ Done syncing members!");
    process.exit(0);
})();
