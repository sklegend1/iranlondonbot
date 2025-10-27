
import { Queue } from "bullmq";
import { redisOptions } from "./queueClient";

export const currencyQueue = new Queue("currency", { connection: redisOptions });

export async function scheduleRepeatableCurrencyJob(cronExpr = "0 * * * *") {
  // default: every hour at :00
  await currencyQueue.add(
    "fetch-latest",
    { action: "fetch" },
    {
      repeat: { pattern: cronExpr, immediately:true },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
  console.log(`[currencyQueue] scheduled repeatable fetch: ${cronExpr}`);
}

export async function enqueueCurrencyFetchOnce() {
  await currencyQueue.add("fetch-once", { action: "fetch" }, { removeOnComplete: true });
  console.log("[currencyQueue] enqueued one-off currency job");
}
