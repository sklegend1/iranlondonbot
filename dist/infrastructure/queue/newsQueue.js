"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsQueue = void 0;
exports.scheduleRepeatableNewsFetch = scheduleRepeatableNewsFetch;
exports.enqueueNewsFetchOnce = enqueueNewsFetchOnce;
const bullmq_1 = require("bullmq");
const queueClient_1 = require("./queueClient");
exports.newsQueue = new bullmq_1.Queue("news", { connection: queueClient_1.redisOptions });
/**
 * Schedule a repeatable fetch job in the news queue.
 * This uses BullMQ repeat option (cron-like or every ms).
 * Using cron expression here: run every 15 minutes by default.
 */
async function scheduleRepeatableNewsFetch(cronExpr = "*/15 * * * *") {
    // add a repeatable job named "fetch-latest"
    await exports.newsQueue.add("fetch-latest", { action: "fetch" }, {
        repeat: { pattern: cronExpr },
        removeOnComplete: 100,
        removeOnFail: 1000,
    });
    console.log(`[newsQueue] scheduled repeatable fetch: ${cronExpr}`);
}
/**
 * Enqueue one-off fetch job (useful for manual trigger).
 */
async function enqueueNewsFetchOnce() {
    await exports.newsQueue.add("fetch-once", { action: "fetch" }, { removeOnComplete: true });
    console.log("[newsQueue] enqueued one-off fetch job");
}
