
import { Queue } from "bullmq";
import { redisOptions } from "./queueClient";

export const newsQueue = new Queue("news", { connection: redisOptions });

/**
 * Schedule a repeatable fetch job in the news queue.
 * This uses BullMQ repeat option (cron-like or every ms).
 * Using cron expression here: run every 15 minutes by default.
 */
export async function scheduleRepeatableNewsFetch(cronExpr = "*/15 * * * *") {
  // add a repeatable job named "fetch-latest"
  await newsQueue.add(
    "fetch-latest",
    { action: "fetch" },
    {
      repeat: { pattern: cronExpr },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
  console.log(`[newsQueue] scheduled repeatable fetch: ${cronExpr}`);
}

/**
 * Enqueue one-off fetch job (useful for manual trigger).
 */
export async function enqueueNewsFetchOnce() {
  await newsQueue.add("fetch-once", { action: "fetch" }, { removeOnComplete: true });
  console.log("[newsQueue] enqueued one-off fetch job");
}
