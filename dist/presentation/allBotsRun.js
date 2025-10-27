"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const adminBot_1 = require("./adminBot");
const groupBot_1 = require("./groupBot");
const PrismaBotSettingRepository_1 = require("../infrastructure/db/repositories/PrismaBotSettingRepository");
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID?.toString() || "";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
const botSetRepo = new PrismaBotSettingRepository_1.PrismaBotSettingRepository();
//const groupBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
let botEnable = false;
bot.use(async (ctx, next) => {
    if (!ctx.chat)
        return;
    botEnable = (await botSetRepo.getValue("group_bot_enabled"))?.value === "true";
    if (ctx.chat.type === "private") {
        ctx.state.botMode = "admin";
        console.log("Setting up admin bot for private chat");
    }
    else if ((ctx.chat.type === "group" || ctx.chat.type === "supergroup") && botEnable) {
        ctx.state.botMode = "group";
        console.log("Setting up group bot for group chat");
    }
    else {
        ctx.state.botMode = "unknown";
    }
    return next();
});
(0, adminBot_1.setupAdminBot)(bot);
(0, groupBot_1.setupGroupBot)(bot);
bot.launch();
console.log("✅ Unified bot launched successfully!");
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
