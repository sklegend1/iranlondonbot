import { Queue } from "bullmq";
import { redisOptions } from "./queueClient";
import "dotenv/config";

export const targetGroupSync = new Queue("targetGroupSync", { connection:redisOptions });
export async function scheduleTargetGroupSync() {
  console.log("🕐 Scheduling recurring group user sync job...");

  
  await targetGroupSync.add(
    "syncTargetGroups",
    {action:"sync"},
    {
      repeat: { every: (Number(process.env.SYNC_TARGETS_WAITING_TIME!)||2) * 60 * 60 * 1000 }, 
      removeOnComplete: false,
      removeOnFail: false,
      
    }
  );

  console.log("✅ Scheduled target groups sync job successfully.");
}
