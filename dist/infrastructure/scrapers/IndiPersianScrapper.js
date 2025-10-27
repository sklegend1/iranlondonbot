"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndiPersianScrapper = void 0;
const RSSScraper_1 = require("./RSSScraper");
/**
 * Simple Indipendent Persian RSS scraper instance
 */
class IndiPersianScrapper extends RSSScraper_1.RSSScraper {
    constructor() {
        super("https://rss.app/feeds/dzFiT0tOvmRV7s9m.xml", "Indipendent Persian");
    }
}
exports.IndiPersianScrapper = IndiPersianScrapper;
