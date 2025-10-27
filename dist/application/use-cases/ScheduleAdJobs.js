"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleAdJobs = void 0;
const adQueue_1 = require("../../infrastructure/queue/adQueue");
class ScheduleAdJobs {
    async execute(ad) {
        const delayUntilStart = new Date(ad.startAt).getTime() - Date.now();
        const delayUntilEnd = new Date(ad.endAt).getTime() - Date.now();
        console.log(`[Scheduler] Ad ${ad.id} will be sent in ${delayUntilStart / 1000}s`);
        console.log(`[Scheduler] Ad ${ad.id} will be deleted in ${delayUntilEnd / 1000}s`);
        // Schedule "send"
        await adQueue_1.adQueue.add("sendAd", { type: "send", ad }, { delay: delayUntilStart, attempts: 3 });
        // Schedule "delete"
        await adQueue_1.adQueue.add("deleteAd", { type: "delete", ad }, { delay: delayUntilEnd, attempts: 3 });
    }
}
exports.ScheduleAdJobs = ScheduleAdJobs;
