"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupUserSyncQueue = void 0;
const bullmq_1 = require("bullmq");
const queueClient_1 = require("./queueClient");
exports.groupUserSyncQueue = new bullmq_1.Queue("groupUserSyncQueue", { connection: queueClient_1.redisOptions });
