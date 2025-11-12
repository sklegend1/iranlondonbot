import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import { redisOptions } from "./queueClient";
import "dotenv/config";

const prisma = new PrismaClient();
export const inviteQueue = new Queue("inviteQueue", { connection:redisOptions });
/**
 * برای همه گروه‌های فعال، یک Job تکرارشونده (Recurring Job)
 * اضافه می‌کند که مثلا هر ۶ ساعت اجرا شود.
 */
export async function scheduleInviteJobs() {
  const groups = await prisma.targetGroup.findMany();

  console.log(`🕐 Scheduling invite jobs for ${groups.length} target groups...`);

  for (const group of groups) {
    await inviteQueue.add(
      `invite_${group.key}`,
      { target: group.key },
      {
        repeat: { every: (Number(process.env.INVITE_WAITING_TIME!)||24) * 60 * 60 * 1000 }, // هر ۶ ساعت
        removeOnComplete: false,
        removeOnFail: false,
      }
    );
  }

  console.log("✅ Invite jobs scheduled for all target groups.");
}
