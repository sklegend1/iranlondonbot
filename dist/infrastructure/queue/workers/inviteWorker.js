"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteWorker = void 0;
const bullmq_1 = require("bullmq");
const InviteFromDB_1 = require("../../telegram/client/InviteFromDB");
const queueClient_1 = require("../queueClient");
exports.inviteWorker = new bullmq_1.Worker("inviteQueue", async (job) => {
    const { target } = job.data;
    console.log(`🚀 Starting invite job for target group: ${target}`);
    try {
        await (0, InviteFromDB_1.inviteFromDB)(target);
        console.log(`✅ Finished inviting for ${target}`);
    }
    catch (err) {
        console.error(`❌ Error in invite job for ${target}:`, err);
        throw err; // اجازه بده BullMQ وضعیت fail رو ثبت کنه
    }
}, { connection: queueClient_1.redisOptions });
// رویدادهای Worker برای لاگ و مانیتورینگ
exports.inviteWorker.on("completed", (job) => {
    console.log(`🎯 Invite job ${job.id} completed successfully`);
});
exports.inviteWorker.on("failed", (job, err) => {
    console.error(`💥 Invite job ${job?.id} failed:`, err.message);
});
