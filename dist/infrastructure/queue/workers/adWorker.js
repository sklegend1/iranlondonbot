"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adWorker = void 0;
// src/infrastructure/queue/workers/adWorker.ts
const bullmq_1 = require("bullmq");
const queueClient_1 = require("../queueClient");
const TelegramService_1 = require("../../telegram/TelegramService");
const UpdateAd_1 = require("../../../application/use-cases/UpdateAd");
const PrismaAdRepository_1 = require("../../db/repositories/PrismaAdRepository");
require('dotenv').config();
const telegramService = new TelegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHANNEL_ID);
const adRepository = new PrismaAdRepository_1.PrismaAdRepository();
const updateAdUseCase = new UpdateAd_1.UpdateAd(adRepository);
// Worker to process ad jobs
exports.adWorker = new bullmq_1.Worker("ads", async (job) => {
    const { type, ad } = job.data;
    if (type === "send") {
        console.log(`[Queue] Sending ad ${ad.id}`);
        const messageId = await telegramService.sendAd(ad.content, ad.imageUrl);
        if (messageId) {
            console.log(`[Queue] Ad ${ad.id} sent with messageId ${messageId}`);
            try {
                const newAd = await updateAdUseCase.execute({
                    id: ad.id,
                    messageId: messageId,
                    content: ad.content,
                    imageUrl: ad.imageUrl,
                    categoryId: ad.categoryId,
                    userId: ad.userId,
                    startAt: ad.startAt,
                    endAt: ad.endAt,
                    verified: ad.verified,
                    receiptText: ad.receiptText,
                    receiptUrl: ad.receiptUrl,
                });
                console.log(`[Queue] Ad ${newAd.id} updated in DB with messageId ${newAd.messageId}`);
            }
            catch (error) {
                console.log(`[Queue] Failed to update ad ${ad.id} in DB:`, error);
            }
            // (Optional) Update ad in DB with messageId if needed
        }
        // (Optional) Save messageId to DB for later deletion
    }
    if (type === "delete") {
        const postedAd = await adRepository.findById(ad.id);
        if (!postedAd) {
            console.log(`[Queue] Ad ${ad.id} not found in DB, skipping deletion`);
            return;
        }
        console.log(`[Queue] Deleting ad ${postedAd.messageId}`);
        if (postedAd.messageId)
            await telegramService.deleteAd(postedAd.messageId);
    }
}, { connection: queueClient_1.redisOptions });
