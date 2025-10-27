import { Queue } from "bullmq";
import { redisOptions } from "./queueClient";

// Queue name: 'ads'
export const adQueue = new Queue("ads", { connection: redisOptions });