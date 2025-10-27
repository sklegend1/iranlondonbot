"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleGroupUserSync = scheduleGroupUserSync;
const groupUserSyncQueue_1 = require("./groupUserSyncQueue");
async function scheduleGroupUserSync() {
    console.log("🕐 Scheduling recurring group user sync job...");
    // تکرار هر ۲ ساعت
    await groupUserSyncQueue_1.groupUserSyncQueue.add("syncAllOperators", {}, {
        repeat: { every: 2 * 60 * 60 * 1000 }, // هر ۲ ساعت
        removeOnComplete: true,
        removeOnFail: false,
    });
    console.log("✅ Scheduled group user sync job successfully.");
}
