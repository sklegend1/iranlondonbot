import cron from "node-cron";
import { CurrencyService } from "../external/CurrencyService";
import { TelegramService } from "../telegram/TelegramService";
import { PostCurrencyUpdate } from "../../application/use-cases/PostCurrencyUpdate";
import  './newsScheduler';

import dotenv from "dotenv";
dotenv.config();
const currencyService = new CurrencyService(process.env.CURRENCY_API_URL! || "https://brsapi.ir/Api/Market/Gold_Currency.php?key=BjWNKvauifivUvdd423z1hs4TH1TXbUz");
const telegramService = new TelegramService(
  process.env.TELEGRAM_BOT_TOKEN!,
  process.env.TELEGRAM_CHANNEL_ID!
);
const postCurrencyUpdate = new PostCurrencyUpdate(currencyService, telegramService);

// Run every hour at :00
cron.schedule("*/1 * * * *", async () => {
  console.log("⏰ Running currency update job...");
  await postCurrencyUpdate.execute();
});
