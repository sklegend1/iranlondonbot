import { adQueue } from "../../infrastructure/queue/adQueue";
import { Ad } from "../../domain/entities/Ad";

export class ScheduleAdJobs {
  async execute(ad: Ad) {
    const delayUntilStart = new Date(ad.startAt).getTime() - Date.now();
    const delayUntilEnd = new Date(ad.endAt).getTime() - Date.now();

    console.log(`[Scheduler] Ad ${ad.id} will be sent in ${delayUntilStart / 1000}s`);
    console.log(`[Scheduler] Ad ${ad.id} will be deleted in ${delayUntilEnd / 1000}s`);

    // Schedule "send"
    await adQueue.add(
      "sendAd",
      { type: "send", ad },
      { delay: delayUntilStart, attempts: 3 }
    );

    // Schedule "delete"
    await adQueue.add(
      "deleteAd",
      { type: "delete", ad },
      { delay: delayUntilEnd, attempts: 3 }
    );
  }
}
