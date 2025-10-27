"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = require("@bull-board/api");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_2 = require("@bull-board/express");
const newsQueue_1 = require("./infrastructure/queue/newsQueue");
const currencyQueue_1 = require("./infrastructure/queue/currencyQueue");
const app = (0, express_1.default)();
const serverAdapter = new express_2.ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
(0, api_1.createBullBoard)({
    queues: [
        new bullMQAdapter_1.BullMQAdapter(newsQueue_1.newsQueue),
        new bullMQAdapter_1.BullMQAdapter(currencyQueue_1.currencyQueue),
    ],
    serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());
app.listen(3001, () => console.log("🚀 BullMQ dashboard: http://localhost:3001/admin/queues"));
