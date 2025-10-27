import { Context, Markup, Scenes, Telegraf } from "telegraf";
import { PrismaClient } from "@prisma/client";
import  "./adminBot"
import { setupAdminBot } from "./adminBot";
import { PrismaBotSettingRepository } from "../infrastructure/db/repositories/PrismaBotSettingRepository";
const prisma = new PrismaClient();
const botSetRepo = new PrismaBotSettingRepository();
// const groupBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
type MySession = Scenes.SceneSession & {
    wizardData?: Record<string, any>;
  };
  
  type MyContext = Context & {
    session: MySession;
    scene: Scenes.SceneContextScene<any, any>;
    wizard: Scenes.WizardContextWizard<any>;
  };
export function setupGroupBot(groupBot:Telegraf<MyContext>){// Welcome message + Bot prevention
    // groupBot.use(async (ctx, next) => {
    //    console.log("Determining bot mode for chat:", ctx.chat?.type);
    //     if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") return;
         
    //      await next();
    //   });

groupBot.on("new_chat_members", async (ctx) => {
  const members = ctx.message.new_chat_members;
  const channelLink = (await prisma.botSetting.findUnique({ where: { key: "main_channel" } }))?.value;
  const welcomeText =
    (await prisma.botSetting.findUnique({ where: { key: "welcome_message" } }))?.value ??
    "👋 Welcome to the group! Please join our channel before participating.";

  for (const m of members) {
    // 🚫 If the user is a bot — ban them
    if (m.is_bot) {
      try {
        await ctx.banChatMember(m.id);
        console.log(`🤖 Bot ${m.username || m.id} banned from group ${ctx.chat.id}`);
      } catch (err) {
        console.error("Ban failed:", err);
      }
      continue;
    }

    // 👋 Send welcome message
    try {
      await ctx.replyWithHTML(`${welcomeText}${channelLink ? `\n\n📢 <a href="${channelLink}">Join the channel</a>` : ""}`);
    } catch (err) {
      console.error("Welcome message failed:", err);
    }
  }
});

// Link sharing restriction
groupBot.on("message", async (ctx, next) => {
    if (ctx.state && ctx.state.botMode !== "group") return next();
    console.log("Checking message for links from user:", ctx.from.id);
  const text = "text" in ctx.message ? ctx.message.text : "";
  if (!text) return next();

  const hasLink = /(https?:\/\/|t\.me\/|@)/i.test(text);
  if (!hasLink) return next();

  // Check if the user is allowed to share links
//   const member = await prisma.targetGroupMember.findUnique({
//     where: { groupId_userId: { groupId: (ctx.chat.id), userId: BigInt(ctx.from.id) } },
//   });

//   if (member?.canShareLinks) return next();

  try {
    await ctx.deleteMessage();
    await ctx.reply("⚠️ ارسال لینک در این گروه مجاز نیست.");
  } catch (err) {
    console.error("Delete failed:", err);
  }
});

// Channel membership enforcement
groupBot.on("message", async (ctx, next) => {
    if (ctx.state && ctx.state.botMode !== "group") return next();
    console.log("Checking channel membership for user:", ctx.from.id);
  const channelLink = (await prisma.botSetting.findUnique({ where: { key: "main_channel" } }))?.value;
  if (!channelLink) return next();

  const channelUsername = channelLink.replace("https://t.me/", "").replace("@", "").trim();

  try {
    const member = await ctx.telegram.getChatMember(`@${channelUsername}`, ctx.from.id);
    if (member.status === "left" || member.status === "kicked") {
      await ctx.deleteMessage();
      await ctx.reply("⛔️ برای فعالیت در گروه باید عضو کانال باشی.", 
         Markup.inlineKeyboard([Markup.button.url("📢 عضویت در کانال", channelLink)])
      );
      
      return;
    }
  } catch (err) {
    console.error("Channel check failed:", err);
  }

  return next();
});}

// Launch the bot
// groupBot.launch().then(() => {
//   console.log("✅ Group management bot started successfully");
// });

// process.once("SIGINT", () => groupBot.stop("SIGINT"));
// process.once("SIGTERM", () => groupBot.stop("SIGTERM"));
