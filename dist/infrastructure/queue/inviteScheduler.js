"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteQueue = void 0;
exports.scheduleInviteJobs = scheduleInviteJobs;
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const queueClient_1 = require("./queueClient");
const prisma = new client_1.PrismaClient();
exports.inviteQueue = new bullmq_1.Queue("inviteQueue", { connection: queueClient_1.redisOptions });
/**
 * برای همه گروه‌های فعال، یک Job تکرارشونده (Recurring Job)
 * اضافه می‌کند که مثلا هر ۶ ساعت اجرا شود.
 */
async function scheduleInviteJobs() {
    const groups = await prisma.targetGroup.findMany();
    console.log(`🕐 Scheduling invite jobs for ${groups.length} target groups...`);
    for (const group of groups) {
        await exports.inviteQueue.add(`invite_${group.key}`, { target: group.key }, {
            repeat: { every: 24 * 60 * 60 * 1000 }, // هر ۶ ساعت
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
    console.log("✅ Invite jobs scheduled for all target groups.");
}
