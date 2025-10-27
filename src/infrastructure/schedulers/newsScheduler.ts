// src/infrastructure/scheduler/newsScheduler.ts
import cron from "node-cron";
import { BBCScraper } from "../scrapers/BBCScraper";
import { TelegramService } from "../telegram/TelegramService";
import { PrismaNewsRepository } from "../db/repositories/PrismaNewsRepository";
import { PostNewsToChannel } from "../../application/use-cases/PostNewsToChannel";
import dotenv from "dotenv";
import { BaseScraper } from "../scrapers/BaseScraper";
import { NewsAggregator } from "../scrapers/NewsAggregator";
import { IndiPersianScrapper } from "../scrapers/IndiPersianScrapper";
import { ReutersScraper } from "../scrapers/ReutersScrapper";

dotenv.config();

const aggregator = new NewsAggregator([new BBCScraper(),new IndiPersianScrapper(),new ReutersScraper()]);
const telegram = new TelegramService(
  process.env.TELEGRAM_BOT_TOKEN!,
  process.env.TELEGRAM_CHANNEL_ID!
);
const newsRepo = new PrismaNewsRepository();
const postNews = new PostNewsToChannel(telegram, newsRepo);

// Run every 30 minutes
cron.schedule("*/1 * * * *", async () => {
  console.log("🕒 Running news fetch job...");
  const news = await aggregator.fetchAll();
  await postNews.execute(news);
});
