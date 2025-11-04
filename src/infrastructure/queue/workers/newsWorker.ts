import { prisma } from './../../db/prismaClient';

// src/infrastructure/queue/workers/newsWorker.ts
import { Worker } from "bullmq";
import { redisOptions } from "../queueClient";
import { NewsAggregator } from "../../scrapers/NewsAggregator";
import { BBCScraper } from "../../scrapers/BBCScraper";
import { IndiPersianScrapper } from "../../scrapers/IndiPersianScrapper";
import { PrismaNewsRepository } from "../../db/repositories/PrismaNewsRepository";
import { PostNewsToChannel } from "../../../application/use-cases/PostNewsToChannel";
import { TelegramService } from "../../telegram/TelegramService";
import { ReutersScraper } from "../../scrapers/ReutersScrapper";
import { Prisma } from '@prisma/client';
import { BaseScraper } from '../../scrapers/BaseScraper';
import { RSSScraper } from '../../scrapers/RSSScraper';
import { PrismaBotSettingRepository } from '../../db/repositories/PrismaBotSettingRepository';

require("dotenv").config();

export async function getNewsSources():Promise<BaseScraper[]>{
  try {
    const sources = await prisma.rssSource.findMany({where:{active:true}})
    let sourceInstances:BaseScraper[] = []
    for( const source of sources){
      const newClass = class InsScrapper extends RSSScraper{
        constructor(){
          super(source.url,source.title)
        } 
      }
      const ins = new newClass()
      sourceInstances.push(ins)
    }
    return sourceInstances
  } catch (error) {
    return []
  }
  
}

// Setup dependencies for news processing

const botSettingRepo = new PrismaBotSettingRepository();
const newsRepo = new PrismaNewsRepository();


// Create worker
export const newsWorker = new Worker(
  "news",
  async (job) => {
    const channelId = (await botSettingRepo.getValue("main_channel"))?.value
    
    const telegram = new TelegramService(
      process.env.TELEGRAM_BOT_TOKEN!,
      (channelId?.startsWith("@")?channelId:`@${channelId?.toLowerCase()}` ) || process.env.TELEGRAM_CHANNEL_ID!
    );
    const postNewsUseCase = new PostNewsToChannel(telegram, newsRepo);
    const newsSources = await getNewsSources();
    const aggregator = new NewsAggregator(newsSources);
    console.log(`[NewsWorker] job received: ${job.name}`);
    if (job.data.action === "fetch") {
      try {
        const items = await aggregator.fetchAll();
        console.log(`[NewsWorker] fetched ${items.length} items from aggregator`);
        await postNewsUseCase.execute(items);
        console.log("[NewsWorker] finished posting news");
      } catch (err) {
        console.error("[NewsWorker] error processing news job:", err);
        throw err; // allow BullMQ to retry according to config
      }
    }
  },
  { connection: redisOptions }
);

// Optional: handle worker events
newsWorker.on("completed", (job) => {
  console.log(`[NewsWorker] completed job ${job.id}`);
});
newsWorker.on("failed", (job, err) => {
  console.error(`[NewsWorker] job ${job?.id} failed:`, err);
});
