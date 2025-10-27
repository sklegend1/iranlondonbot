"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const CurrencyService_1 = require("../external/CurrencyService");
const TelegramService_1 = require("../telegram/TelegramService");
const PostCurrencyUpdate_1 = require("../../application/use-cases/PostCurrencyUpdate");
require("./newsScheduler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const currencyService = new CurrencyService_1.CurrencyService(process.env.CURRENCY_API_URL || "https://brsapi.ir/Api/Market/Gold_Currency.php?key=BjWNKvauifivUvdd423z1hs4TH1TXbUz");
const telegramService = new TelegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHANNEL_ID);
const postCurrencyUpdate = new PostCurrencyUpdate_1.PostCurrencyUpdate(currencyService, telegramService);
// Run every hour at :00
node_cron_1.default.schedule("*/1 * * * *", async () => {
    console.log("⏰ Running currency update job...");
    await postCurrencyUpdate.execute();
});
