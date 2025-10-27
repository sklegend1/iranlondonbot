"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupUserSyncWorker = void 0;
const bullmq_1 = require("bullmq");
const client_1 = require("@prisma/client");
const AddGroupUsersToDB_1 = require("../../telegram/client/AddGroupUsersToDB");
const queueClient_1 = require("../queueClient");
const prisma = new client_1.PrismaClient();
//const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
exports.groupUserSyncWorker = new bullmq_1.Worker("groupUserSyncQueue", async (job) => {
    console.log(`🚀 Running job ${job.id} - Sync group users`);
    // اپراتورهای فعال
    const operators = await prisma.operator.findMany({
        where: { enabled: true },
    });
    console.log(`Found ${operators.length} active operators.`);
    for (const op of operators) {
        try {
            console.log(`👤 Syncing for operator ${op.name || op.id}`);
            await (0, AddGroupUsersToDB_1.addGroupUsersToDB)(op.apiId, op.apiHash);
            console.log(`✅ Done for ${op.name || op.id}`);
        }
        catch (err) {
            console.error(`❌ Failed for ${op.name || op.id}:`, err);
        }
    }
    console.log("🎯 All operators processed.");
}, { connection: queueClient_1.redisOptions });
exports.groupUserSyncWorker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
});
exports.groupUserSyncWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
});
