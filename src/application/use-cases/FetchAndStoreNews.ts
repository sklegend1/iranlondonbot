import { NewsAggregator } from "../../infrastructure/scrapers/NewsAggregator";
import { PrismaNewsRepository } from "../../infrastructure/db/repositories/PrismaNewsRepository";

// export class FetchAndStoreNews {
//   constructor(private aggregator: NewsAggregator, private repo: PrismaNewsRepository) {}

//   async execute() {
//     const items = await this.aggregator.fetchAll();
//     const results = [];
//     for (const it of items) {
//       try {
//         const saved = await this.repo.upsertByLink(it);
//         results.push(saved);
//       } catch (err) {
//         console.error("Failed to save news:", err);
//       }
//     }
//     return results;
//   }
// }