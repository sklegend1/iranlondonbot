import { adQueue } from "./adQueue";
import { Ad } from "../../domain/entities/Ad";

export class ScheduleAdJobs {
  async execute(ad: Ad) {
    const delayUntilStart = new Date(ad.startAt).getTime() - Date.now();
    const delayUntilEnd = new Date(ad.endAt).getTime() - Date.now();

    console.log(`[Scheduler] Ad ${ad.id} will be sent in ${delayUntilStart / 1000}s`);
    console.log(`[Scheduler] Ad ${ad.id} will be deleted in ${delayUntilEnd / 1000}s`);

    console.log(`[Scheduler] Connected to Redis for queue: ${adQueue.name}`);
    // Schedule "send"
    await adQueue.add(
      "sendAd",
      { type: "send", ad },
      { delay: Math.max(0,delayUntilStart), attempts: 3 }
    );
    console.log(`[Scheduler] Job "sendAd" added for Ad ${ad.id} with delay ${delayUntilStart}ms`);

    // Schedule "delete"
    await adQueue.add(
      "deleteAd",
      { type: "delete", ad },
      { delay: Math.max(0,delayUntilEnd), attempts: 3 }
    );
  }
}
