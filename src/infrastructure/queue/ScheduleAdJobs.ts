import { UpdateAd } from './../../application/use-cases/UpdateAd';
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

  async executePin(ad: Ad) {
    const delayUntilStart =  0;
    const pinDuration = 7 * 24 * 60 * 60 * 1000;// one week 
    const delayUntilEnd = delayUntilStart + pinDuration; 

    console.log(`[Scheduler] Ad ${ad.id} will be pined in ${delayUntilStart / 1000}s`);
    console.log(`[Scheduler] Ad ${ad.id} will be unpined in ${delayUntilEnd / 1000}s`);

    console.log(`[Scheduler] Connected to Redis for queue: ${adQueue.name}`);
    // Schedule "Pin"
    await adQueue.add(
      "pinAd",
      { type: "pin", ad },
      { delay: Math.max(0,delayUntilStart), attempts: 3 }
    );
    console.log(`[Scheduler] Job "pinAd" added for Ad ${ad.id} with delay ${delayUntilStart}ms`);

    // Schedule "Unpin"
    await adQueue.add(
      "unpinAd",
      { type: "unpin", ad },
      { delay: Math.max(0,delayUntilEnd), attempts: 3 }
    );
  }

}
