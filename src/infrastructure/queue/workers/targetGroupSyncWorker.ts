import { targetGroupSync } from './../syncTargetQueue';
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { addGroupUsersToDB } from "../../telegram/client/AddGroupUsersToDB";
import { redisOptions } from "../queueClient";
import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { syncTargetGroupMembers } from "../../telegram/client/syncTargetGroupMembers";

const prisma = new PrismaClient();
//const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const apiId = Number(process.env.TELEGRAM_API_ID0);
const apiHash = process.env.TELEGRAM_API_HASH0;
const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION0!);

export const targetGroupSyncWorker = new Worker(
  "targetGroupSync",
  async (job: Job) => {
    console.log(`🚀 Running job ${job.id} - Sync group users`);
    const client = new TelegramClient(stringSession, apiId, apiHash!, {
        connectionRetries: 999,
        timeout: 30
      });
    
      console.log("Connecting to Telegram...");
      await client.connect();
    // اپراتورهای فعال
    const targets = await prisma.targetGroup.findMany();

    console.log(`Found ${targets.length} active targets.`);

    for (const tg of targets) {
      try {
        console.log(`👤 Syncing for group ${tg.key || tg.username}`);
        await syncTargetGroupMembers(client,tg.key,tg.username!);
        console.log(`✅ Done for ${tg.key || tg.username}`);
      } catch (err) {
        console.error(`❌ Failed for ${tg.key || tg.username}:`, err);
      }
    }

    console.log("🎯 All targets processed.");
  },
  { connection : redisOptions }
);

targetGroupSyncWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

targetGroupSyncWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
