"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const newsQueue_1 = require("../infrastructure/queue/newsQueue");
const currencyQueue_1 = require("../infrastructure/queue/currencyQueue");
require("../infrastructure/queue/workers/newsWorker"); // start worker process if you want in same process for testing
require("../infrastructure/queue/workers/currencyWorker");
(async () => {
    // Setup repeatable jobs (change cron expressions as you need)
    await (0, newsQueue_1.scheduleRepeatableNewsFetch)("*/2 * * * *"); // every 15 minutes
    await (0, currencyQueue_1.scheduleRepeatableCurrencyJob)("*/3 * * * *"); // every hour at :00
    // Optionally trigger immediate runs for testing:
    //await enqueueNewsFetchOnce();
    //await enqueueCurrencyFetchOnce();
    console.log("✅ Queue scheduling complete");
})();
