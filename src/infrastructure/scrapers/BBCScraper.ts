
import { RSSScraper } from "./RSSScraper";

/**
 * Simple BBC RSS scraper instance
 */
export class BBCScraper extends RSSScraper {
  constructor() {
    super("https://feeds.bbci.co.uk/persian/rss.xml", "BBC");
  }
}
