import { Context, Scenes, Telegraf } from "telegraf";
import { setupAdminBot } from "./adminBot";
import { setupGroupBot } from "./groupBot";
import { PrismaBotSettingRepository } from "../infrastructure/db/repositories/PrismaBotSettingRepository";
import { groupUserSyncWorker } from "../infrastructure/queue/workers/groupUserSyncWorker";
import { inviteWorker } from "../infrastructure/queue/workers/inviteWorker";
type MySession = Scenes.SceneSession & {
    wizardData?: Record<string, any>;
  };
  
  type MyContext = Context & {
    session: MySession;
    scene: Scenes.SceneContextScene<any, any>;
    wizard: Scenes.WizardContextWizard<any>;
  };
  
  const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID?.toString() || "";
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
  }
  
const bot = new Telegraf<MyContext>(BOT_TOKEN);
const botSetRepo = new PrismaBotSettingRepository();
//const groupBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
let botEnable :boolean = false;
bot.use(async (ctx, next) => {
    if (!ctx.chat) return;
    botEnable = (await botSetRepo.getValue("group_bot_enabled"))?.value === "true";
    if (ctx.chat.type === "private") {
      ctx.state.botMode = "admin";
      console.log("Setting up admin bot for private chat");
       
    } else if ((ctx.chat.type === "group" || ctx.chat.type === "supergroup") && botEnable) {
      ctx.state.botMode = "group";
      console.log("Setting up group bot for group chat");
       
    } else {
      ctx.state.botMode = "unknown";
    }
    return next();
  });

  
    
    setupAdminBot(bot);
    setupGroupBot(bot);
  
    
  




bot.launch()

console.log("✅ Unified bot launched successfully!");
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));