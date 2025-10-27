"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReutersScraper = void 0;
const RSSScraper_1 = require("./RSSScraper");
/**
 * Simple Reuters RSS scraper instance
 */
class ReutersScraper extends RSSScraper_1.RSSScraper {
    constructor() {
        super("https://rss.app/feeds/tcgTuoElpBSbtvY0.xml", "Reuters");
    }
}
exports.ReutersScraper = ReutersScraper;
