"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/scheduler/newsScheduler.ts
const node_cron_1 = __importDefault(require("node-cron"));
const BBCScraper_1 = require("../scrapers/BBCScraper");
const TelegramService_1 = require("../telegram/TelegramService");
const PrismaNewsRepository_1 = require("../db/repositories/PrismaNewsRepository");
const PostNewsToChannel_1 = require("../../application/use-cases/PostNewsToChannel");
const dotenv_1 = __importDefault(require("dotenv"));
const NewsAggregator_1 = require("../scrapers/NewsAggregator");
const IndiPersianScrapper_1 = require("../scrapers/IndiPersianScrapper");
const ReutersScrapper_1 = require("../scrapers/ReutersScrapper");
dotenv_1.default.config();
const aggregator = new NewsAggregator_1.NewsAggregator([new BBCScraper_1.BBCScraper(), new IndiPersianScrapper_1.IndiPersianScrapper(), new ReutersScrapper_1.ReutersScraper()]);
const telegram = new TelegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHANNEL_ID);
const newsRepo = new PrismaNewsRepository_1.PrismaNewsRepository();
const postNews = new PostNewsToChannel_1.PostNewsToChannel(telegram, newsRepo);
// Run every 30 minutes
node_cron_1.default.schedule("*/1 * * * *", async () => {
    console.log("🕒 Running news fetch job...");
    const news = await aggregator.fetchAll();
    await postNews.execute(news);
});
