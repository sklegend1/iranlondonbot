"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyQueue = void 0;
exports.scheduleRepeatableCurrencyJob = scheduleRepeatableCurrencyJob;
exports.enqueueCurrencyFetchOnce = enqueueCurrencyFetchOnce;
const bullmq_1 = require("bullmq");
const queueClient_1 = require("./queueClient");
exports.currencyQueue = new bullmq_1.Queue("currency", { connection: queueClient_1.redisOptions });
async function scheduleRepeatableCurrencyJob(cronExpr = "0 * * * *") {
    // default: every hour at :00
    await exports.currencyQueue.add("fetch-latest", { action: "fetch" }, {
        repeat: { pattern: cronExpr, immediately: true },
        removeOnComplete: 100,
        removeOnFail: 1000,
    });
    console.log(`[currencyQueue] scheduled repeatable fetch: ${cronExpr}`);
}
async function enqueueCurrencyFetchOnce() {
    await exports.currencyQueue.add("fetch-once", { action: "fetch" }, { removeOnComplete: true });
    console.log("[currencyQueue] enqueued one-off currency job");
}
