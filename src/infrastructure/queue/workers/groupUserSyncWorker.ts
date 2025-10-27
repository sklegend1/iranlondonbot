import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { addGroupUsersToDB } from "../../telegram/client/AddGroupUsersToDB";
import { redisOptions } from "../queueClient";

const prisma = new PrismaClient();
//const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

export const groupUserSyncWorker = new Worker(
  "groupUserSyncQueue",
  async (job: Job) => {
    console.log(`🚀 Running job ${job.id} - Sync group users`);

    // اپراتورهای فعال
    const operators = await prisma.operator.findMany({
      where: { enabled: true },
    });

    console.log(`Found ${operators.length} active operators.`);

    for (const op of operators) {
      try {
        console.log(`👤 Syncing for operator ${op.name || op.id}`);
        await addGroupUsersToDB(op.apiId, op.apiHash);
        console.log(`✅ Done for ${op.name || op.id}`);
      } catch (err) {
        console.error(`❌ Failed for ${op.name || op.id}:`, err);
      }
    }

    console.log("🎯 All operators processed.");
  },
  { connection : redisOptions }
);

groupUserSyncWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

groupUserSyncWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
