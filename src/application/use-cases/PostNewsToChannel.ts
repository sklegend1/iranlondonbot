// src/application/use-cases/PostNewsToChannel.ts
import { TelegramService } from "../../infrastructure/telegram/TelegramService";
import { PrismaNewsRepository } from "../../infrastructure/db/repositories/PrismaNewsRepository";
import { News } from "../../domain/entities/News";

export class PostNewsToChannel {
  constructor(
    private telegram: TelegramService,
    private newsRepo: PrismaNewsRepository
  ) {}

  async execute(newsList: News[]) {
    for (const news of newsList) {
        //console.log(`Processing news from: ${news.source}`);
        let image = news.image;
        if(news.source === 'BBC Persian' && image ){
            image = image.replace('/240/','/720/');
        }
        // else if(news.source === 'The Guardian' && image){
        //   image = image.replace('width=140','width=700');
        // }
      const exists = await this.newsRepo.findByLink(news.link);
      if (exists) continue;

      const caption = `📰 *${news.title}*\n\n${news.content.slice(0,1019 - `\n\nFull article : ${news.link}📰 *${news.title}*\n\n`.length)} ${news.content.length>(1019-`\n\nFull article : ${news.link}📰 *${news.title}*\n\n`.length) ? ' ...':''}\n\nFull article : ${news.link}`;
      
      try {
        await this.telegram.sendAd(caption, image);
        await this.newsRepo.save({ ...news, posted: true });
        console.log(`✅ Posted: ${news.title}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (err) {
        console.error(`❌ Failed to post: ${news.title}`, err);
      }
    }
  }
}
