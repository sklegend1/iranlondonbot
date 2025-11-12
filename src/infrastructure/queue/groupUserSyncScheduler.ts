import { groupUserSyncQueue } from "./groupUserSyncQueue";
import "dotenv/config";
export async function scheduleGroupUserSync() {
  console.log("🕐 Scheduling recurring group user sync job...");

  // تکرار هر ۲ ساعت
  await groupUserSyncQueue.add(
    "syncAllOperators",
    {},
    {
      repeat: { every: (Number(process.env.SYNC_USERS_WAITING_TIME!)||48) * 60 * 60 * 1000 }, // هر ۲ ساعت
      removeOnComplete: false,
      removeOnFail: false,
      
    }
  );

  console.log("✅ Scheduled group user sync job successfully.");
}
