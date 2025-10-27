// src/infrastructure/scrapers/NewsAggregator.ts
import { News } from "../../domain/entities/News";
import { BaseScraper, NewsItem } from "./BaseScraper";

export class NewsAggregator {
  constructor(private scrapers: BaseScraper[]) {}

  /**
   * Fetch all scrapers and merge sorted by publishedAt desc
   */
  async fetchAll(): Promise<News[]> {
    const results = await Promise.all(this.scrapers.map((s) => s.fetchLatest()));
    
    const flat = results.flat();
    //console.log('Source example : ' , flat[1]?.source )
    // deduplicate by link
    const map = new Map<string, News>();
    for (const item of flat) {
      if (!item.link) continue;
      // keep the newest if duplicate
      const existing = map.get(item.link);
      if (!existing || item.publishedAt.getTime() > existing.publishedAt.getTime()) {
        map.set(item.link, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}
