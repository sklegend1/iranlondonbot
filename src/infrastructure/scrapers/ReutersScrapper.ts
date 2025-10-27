
import { RSSScraper } from "./RSSScraper";

/**
 * Simple Reuters RSS scraper instance
 */
export class ReutersScraper extends RSSScraper {
  constructor() {
    super("https://rss.app/feeds/tcgTuoElpBSbtvY0.xml", "Reuters");
  }
}
