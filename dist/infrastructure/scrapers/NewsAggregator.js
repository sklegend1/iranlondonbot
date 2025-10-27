"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAggregator = void 0;
class NewsAggregator {
    constructor(scrapers) {
        this.scrapers = scrapers;
    }
    /**
     * Fetch all scrapers and merge sorted by publishedAt desc
     */
    async fetchAll() {
        const results = await Promise.all(this.scrapers.map((s) => s.fetchLatest()));
        const flat = results.flat();
        //console.log('Source example : ' , flat[1]?.source )
        // deduplicate by link
        const map = new Map();
        for (const item of flat) {
            if (!item.link)
                continue;
            // keep the newest if duplicate
            const existing = map.get(item.link);
            if (!existing || item.publishedAt.getTime() > existing.publishedAt.getTime()) {
                map.set(item.link, item);
            }
        }
        return Array.from(map.values()).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    }
}
exports.NewsAggregator = NewsAggregator;
