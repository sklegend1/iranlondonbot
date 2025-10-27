import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { inviteFromDB } from "../../telegram/client/InviteFromDB";
import { redisOptions } from "../queueClient";



export const inviteWorker = new Worker(
  "inviteQueue",
  async (job: Job) => {
    const { target } = job.data;
    console.log(`🚀 Starting invite job for target group: ${target}`);
    try {
      await inviteFromDB(target);
      console.log(`✅ Finished inviting for ${target}`);
    } catch (err) {
      console.error(`❌ Error in invite job for ${target}:`, err);
      throw err; // اجازه بده BullMQ وضعیت fail رو ثبت کنه
    }
  },
  { connection:redisOptions }
);

// رویدادهای Worker برای لاگ و مانیتورینگ
inviteWorker.on("completed", (job) => {
  console.log(`🎯 Invite job ${job.id} completed successfully`);
});

inviteWorker.on("failed", (job, err) => {
  console.error(`💥 Invite job ${job?.id} failed:`, err.message);
});
