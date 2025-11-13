import { scheduleRepeatableNewsFetch, enqueueNewsFetchOnce } from "../infrastructure/queue/newsQueue";
import { scheduleRepeatableCurrencyJob, enqueueCurrencyFetchOnce } from "../infrastructure/queue/currencyQueue";
import "../infrastructure/queue/workers/newsWorker"; // start worker process if you want in same process for testing
import "../infrastructure/queue/workers/currencyWorker";

(async () => {
  // Setup repeatable jobs (change cron expressions as you need)
  await scheduleRepeatableNewsFetch("0 */3 * * *"); // every 15 minutes
  await scheduleRepeatableCurrencyJob("0 */3 * * *"); // every hour at :00

  // Optionally trigger immediate runs for testing:
  //await enqueueNewsFetchOnce();
  //await enqueueCurrencyFetchOnce();
  console.log("✅ Queue scheduling complete");
})();