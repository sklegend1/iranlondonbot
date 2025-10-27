import { News } from "../../domain/entities/News";

export type NewsItem = {
    title: string;
    link: string;
    content?: string | null;
    source: string;
    publishedAt: Date;
    image?: string | null;
  };
  
  /**
   * Abstract scraper contract for specific scrapers to implement.
   */
  export abstract class BaseScraper {
    abstract fetchLatest(): Promise<News[]>;
  }
  