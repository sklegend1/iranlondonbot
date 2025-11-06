// src/infrastructure/queue/workers/currencyWorker.ts
import { Worker } from "bullmq";
import { redisOptions } from "../queueClient";
import { CurrencyService } from "../../external/CurrencyService";
import { TelegramService } from "../../telegram/TelegramService";
import { PostCurrencyUpdate } from "../../../application/use-cases/PostCurrencyUpdate";
import { PrismaBotSettingRepository } from "../../db/repositories/PrismaBotSettingRepository";

require("dotenv").config();
const botSettingRepo = new PrismaBotSettingRepository();
const currencyService = new CurrencyService(process.env.CURRENCY_API_URL!);


export const currencyWorker = new Worker(
  "currency",
  async (job) => {

    const channelId = (await botSettingRepo.getValue("main_channel"))?.value
    
    const telegram = new TelegramService(
      process.env.TELEGRAM_BOT_TOKEN!,
      (channelId?.startsWith("@")?channelId:`@${channelId?.toLowerCase()}` ) || process.env.TELEGRAM_CHANNEL_ID!
    );
    const postCurrency = new PostCurrencyUpdate(currencyService, telegram);
    console.log(`[CurrencyWorker] job received: ${job.name}`);
    if (job.data.action === "fetch") {
      try {
        await postCurrency.execute();
        console.log("[CurrencyWorker] posted currency update");
      } catch (err) {
        console.error("[CurrencyWorker] error processing currency job:", err);
        throw err;
      }
    }
  },
  { connection: redisOptions }
);

currencyWorker.on("completed", (job) => {
  console.log(`[CurrencyWorker] completed job ${job.id}`);
});
currencyWorker.on("failed", (job, err) => {
  console.error(`[CurrencyWorker] job ${job?.id} failed:`, err);
});
