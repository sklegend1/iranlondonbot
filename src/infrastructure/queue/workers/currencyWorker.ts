// src/infrastructure/queue/workers/currencyWorker.ts
import { Worker } from "bullmq";
import { redisOptions } from "../queueClient";
import { CurrencyService } from "../../external/CurrencyService";
import { TelegramService } from "../../telegram/TelegramService";
import { PostCurrencyUpdate } from "../../../application/use-cases/PostCurrencyUpdate";

require("dotenv").config();

const currencyService = new CurrencyService(process.env.CURRENCY_API_URL!);
const telegram = new TelegramService(process.env.TELEGRAM_BOT_TOKEN!, process.env.TELEGRAM_CHANNEL_ID!);
const postCurrency = new PostCurrencyUpdate(currencyService, telegram);

export const currencyWorker = new Worker(
  "currency",
  async (job) => {
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
