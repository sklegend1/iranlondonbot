"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBCScraper = void 0;
const RSSScraper_1 = require("./RSSScraper");
/**
 * Simple BBC RSS scraper instance
 */
class BBCScraper extends RSSScraper_1.RSSScraper {
    constructor() {
        super("https://feeds.bbci.co.uk/persian/rss.xml", "BBC");
    }
}
exports.BBCScraper = BBCScraper;
