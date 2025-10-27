
import { RSSScraper } from "./RSSScraper";

/**
 * Simple Indipendent Persian RSS scraper instance
 */
export class IndiPersianScrapper extends RSSScraper {
  constructor() {
    super("https://rss.app/feeds/dzFiT0tOvmRV7s9m.xml", "Indipendent Persian");
  }
}
