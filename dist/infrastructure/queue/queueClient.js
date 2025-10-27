"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisOptions = void 0;
const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
};
exports.redisOptions = redisOptions;
