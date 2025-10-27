"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSSScraper = void 0;
const rss_parser_1 = __importDefault(require("rss-parser"));
const BaseScraper_1 = require("./BaseScraper");
class RSSScraper extends BaseScraper_1.BaseScraper {
    constructor(feedUrl, sourceName) {
        super();
        this.feedUrl = feedUrl;
        this.sourceName = sourceName;
        this.parser = new rss_parser_1.default();
        // configure parser to extract media:thumbnail
        this.parser = new rss_parser_1.default({
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
    async fetchLatest() {
        const feed = await this.parser.parseURL(this.feedUrl);
        console.log('Source : ', feed.title);
        return (feed.items.slice(0, 5) || []).map((item) => {
            const published = item.isoDate || item.pubDate || new Date().toISOString();
            return {
                title: item.title || "No title",
                link: item.link || item.guid || "",
                content: (item.contentSnippet || item.content || item.summary) ?? null,
                source: this.sourceName,
                publishedAt: new Date(published),
                image: (item.enclosure && item.enclosure.url) || (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) ||
                    (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) ||
                    null,
            };
        });
    }
}
exports.RSSScraper = RSSScraper;
