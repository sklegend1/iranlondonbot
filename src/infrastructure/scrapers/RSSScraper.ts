
import Parser from "rss-parser";
import { BaseScraper, NewsItem } from "./BaseScraper";
import { News } from "../../domain/entities/News";

export class RSSScraper extends BaseScraper {
  private parser = new Parser();

  constructor(private feedUrl: string, private sourceName: string) {
    super();
    // configure parser to extract media:thumbnail
    this.parser = new Parser({
        customFields: {
          item: [
            ["media:thumbnail", "mediaThumbnail"],
            ["media:content", "mediaContent"],
          ],
        },
      });
  }

  /**
   * Fetch feed and normalize items into NewsItem[]
   */
  async fetchLatest(): Promise<News[]> {
    const feed = await this.parser.parseURL(this.feedUrl);
    console.log('Source : ' , feed.title )
    return (feed.items.slice(0,5) || []).map((item: any) => {
      const published = item.isoDate || item.pubDate || new Date().toISOString();
      

      return {
        title: item.title || "No title",
        link: item.link || item.guid || "",
        content: ((item.contentSnippet || item.content || item.summary) as string) ?? null,
        source: this.sourceName,
        publishedAt: new Date(published),
        image: (item.enclosure && item.enclosure.url) || (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) || 
        ( item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) ||
        null,
      } as News;
    });
  }
}
