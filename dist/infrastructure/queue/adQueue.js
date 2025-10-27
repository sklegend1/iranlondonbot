"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adQueue = void 0;
const bullmq_1 = require("bullmq");
const queueClient_1 = require("./queueClient");
// Queue name: 'ads'
exports.adQueue = new bullmq_1.Queue("ads", { connection: queueClient_1.redisOptions });
