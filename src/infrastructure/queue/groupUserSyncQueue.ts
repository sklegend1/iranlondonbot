import { Queue } from "bullmq";
import IORedis from "ioredis";
import { redisOptions } from "./queueClient";



export const groupUserSyncQueue = new Queue("groupUserSyncQueue", { connection:redisOptions });
