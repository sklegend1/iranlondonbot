"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyWorker = void 0;
// src/infrastructure/queue/workers/currencyWorker.ts
const bullmq_1 = require("bullmq");
const queueClient_1 = require("../queueClient");
const CurrencyService_1 = require("../../external/CurrencyService");
const TelegramService_1 = require("../../telegram/TelegramService");
const PostCurrencyUpdate_1 = require("../../../application/use-cases/PostCurrencyUpdate");
require("dotenv").config();
const currencyService = new CurrencyService_1.CurrencyService(process.env.CURRENCY_API_URL);
const telegram = new TelegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHANNEL_ID);
const postCurrency = new PostCurrencyUpdate_1.PostCurrencyUpdate(currencyService, telegram);
exports.currencyWorker = new bullmq_1.Worker("currency", async (job) => {
    console.log(`[CurrencyWorker] job received: ${job.name}`);
    if (job.data.action === "fetch") {
        try {
            await postCurrency.execute();
            console.log("[CurrencyWorker] posted currency update");
        }
        catch (err) {
            console.error("[CurrencyWorker] error processing currency job:", err);
            throw err;
        }
    }
}, { connection: queueClient_1.redisOptions });
exports.currencyWorker.on("completed", (job) => {
    console.log(`[CurrencyWorker] completed job ${job.id}`);
});
exports.currencyWorker.on("failed", (job, err) => {
    console.error(`[CurrencyWorker] job ${job?.id} failed:`, err);
});
