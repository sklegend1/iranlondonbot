import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { newsQueue } from "./infrastructure/queue/newsQueue";
import { currencyQueue } from "./infrastructure/queue/currencyQueue";
import { targetGroupSync } from "./infrastructure/queue/syncTargetQueue";
import { inviteQueue } from "./infrastructure/queue/inviteScheduler";
import { groupUserSyncQueue } from "./infrastructure/queue/groupUserSyncQueue";

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(newsQueue),
    new BullMQAdapter(currencyQueue),
    new BullMQAdapter(targetGroupSync),
    new BullMQAdapter(inviteQueue),
    new BullMQAdapter(groupUserSyncQueue)
  ],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());
app.listen(3001, () => console.log("🚀 BullMQ dashboard: http://localhost:3001/admin/queues"));
