"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsWorker = void 0;
exports.getNewsSources = getNewsSources;
const prismaClient_1 = require("./../../db/prismaClient");
// src/infrastructure/queue/workers/newsWorker.ts
const bullmq_1 = require("bullmq");
const queueClient_1 = require("../queueClient");
const NewsAggregator_1 = require("../../scrapers/NewsAggregator");
const PrismaNewsRepository_1 = require("../../db/repositories/PrismaNewsRepository");
const PostNewsToChannel_1 = require("../../../application/use-cases/PostNewsToChannel");
const TelegramService_1 = require("../../telegram/TelegramService");
const RSSScraper_1 = require("../../scrapers/RSSScraper");
require("dotenv").config();
async function getNewsSources() {
    try {
        const sources = await prismaClient_1.prisma.rssSource.findMany({ where: { active: true } });
        let sourceInstances = [];
        for (const source of sources) {
            const newClass = class InsScrapper extends RSSScraper_1.RSSScraper {
                constructor() {
                    super(source.url, source.title);
                }
            };
            const ins = new newClass();
            sourceInstances.push(ins);
        }
        return sourceInstances;
    }
    catch (error) {
        return [];
    }
}
// Setup dependencies for news processing
const newsRepo = new PrismaNewsRepository_1.PrismaNewsRepository();
const telegram = new TelegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHANNEL_ID);
const postNewsUseCase = new PostNewsToChannel_1.PostNewsToChannel(telegram, newsRepo);
// Create worker
exports.newsWorker = new bullmq_1.Worker("news", async (job) => {
    const newsSources = await getNewsSources();
    const aggregator = new NewsAggregator_1.NewsAggregator(newsSources);
    console.log(`[NewsWorker] job received: ${job.name}`);
    if (job.data.action === "fetch") {
        try {
            const items = await aggregator.fetchAll();
            console.log(`[NewsWorker] fetched ${items.length} items from aggregator`);
            await postNewsUseCase.execute(items);
            console.log("[NewsWorker] finished posting news");
        }
        catch (err) {
            console.error("[NewsWorker] error processing news job:", err);
            throw err; // allow BullMQ to retry according to config
        }
    }
}, { connection: queueClient_1.redisOptions });
// Optional: handle worker events
exports.newsWorker.on("completed", (job) => {
    console.log(`[NewsWorker] completed job ${job.id}`);
});
exports.newsWorker.on("failed", (job, err) => {
    console.error(`[NewsWorker] job ${job?.id} failed:`, err);
});
