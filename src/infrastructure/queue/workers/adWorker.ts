// src/infrastructure/queue/workers/adWorker.ts
import { Worker } from "bullmq";
import { redisOptions } from "../queueClient";
import { TelegramService } from "../../telegram/TelegramService";
import { UpdateAd } from "../../../application/use-cases/UpdateAd";
import { PrismaAdRepository } from "../../db/repositories/PrismaAdRepository";
import { PrismaBotSettingRepository } from "../../db/repositories/PrismaBotSettingRepository";
import { ScheduleAdJobs } from "../ScheduleAdJobs";
require('dotenv').config();

// const telegramService = new TelegramService(
//   process.env.TELEGRAM_BOT_TOKEN!,
//   process.env.TELEGRAM_CHANNEL_ID!
// );

const adRepository = new PrismaAdRepository();
const updateAdUseCase = new UpdateAd(adRepository);
const botSettingRepo = new PrismaBotSettingRepository();
const scheduler = new ScheduleAdJobs();
// Worker to process ad jobs
export const adWorker = new Worker(
  "ads",
  async (job) => {
    console.log(`[Worker] Listening to queue: ads`);
    const { type, ad } = job.data;
    const channelId = (await botSettingRepo.getValue("main_channel"))?.value
    
    const telegramService = new TelegramService(
      process.env.TELEGRAM_BOT_TOKEN!,
      (channelId?.startsWith("@")?channelId:`@${channelId?.toLowerCase()}` ) || process.env.TELEGRAM_CHANNEL_ID!
    );
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
            verified: true,
            receiptText: ad.receiptText,
            receiptUrl:   ad.receiptUrl,
          });
          console.log(`[Queue] Ad ${newAd.id} updated in DB with messageId ${newAd.messageId}`);
          try {
            scheduler.executePin(newAd); // Schedule pin/unpin jobs
          } catch (error) {
            console.log(`[Scheduler] Failed to schedule pin/unpin for ad ${newAd.id}:`, error);
          }
          
        } catch (error) {
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
      if (postedAd.messageId) await telegramService.deleteAd(postedAd.messageId);
    }

    if(type === "pin") {
      console.log(`[Queue] Pinning ad ${ad.id}`);
      if (ad.messageId) await telegramService.pinAd(ad.messageId);
    }
    if(type === "unpin") {
      console.log(`[Queue] Unpinning ad ${ad.id}`);
      if (ad.messageId) await telegramService.unpinAd(ad.messageId);
    }

  },
  { connection: redisOptions }
);
