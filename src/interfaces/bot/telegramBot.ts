// src/interfaces/bot/telegramBot.ts
import { Telegraf, Markup, Context } from "telegraf";
// Option A: if your telegraf exports session middleware (older bundles)
import { session } from "telegraf";
// Option B (recommended if Option A not available): install @telegraf/session
//import session from "@telegraf/session";

import { PrismaAdRepository } from "../../infrastructure/db/repositories/PrismaAdRepository";
import { CreateAd } from "../../application/use-cases/CreateAd";
import { ScheduleAdJobs } from "../../application/use-cases/ScheduleAdJobs";
import { PrismaUserRepository } from "../../infrastructure/db/repositories/PrismaUserRepository";
import { PrismaCategoryRepository } from "../../infrastructure/db/repositories/PrismaCategoryRepository";
import { Category } from "../../domain/entities/Category";
import { FakePaymentGateway } from "../../infrastructure/payments/FakePaymentGateway";
import { ProcessPayment } from "../../application/use-cases/ProcessPayment";
// ---------- Types ----------
// Define the shape of our session data
interface SessionData {
  categoryId?: number;
    userId?: number;
    paid? : boolean ;
    waitingForTime?: boolean;
    startAt?: Date;
      endAt?: Date; 
  // you can add more conversation state fields here
}

// Extend Telegraf Context to include our session shape
interface MyContext extends Context {
  session?: SessionData;
}

// ---------- Bot init ----------
const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);
// attach session middleware
bot.use(session()); // use whichever import you have

// repository and use-case instances
const adRepo = new PrismaAdRepository();
const createAd = new CreateAd(adRepo);
const scheduler = new ScheduleAdJobs();
const userRepo = new PrismaUserRepository();
const catRepo = new PrismaCategoryRepository();
const paymentGateway = new FakePaymentGateway();
const processPayment = new ProcessPayment(paymentGateway);
// ---------- Helpers ----------
 function categoryKeyboard(cats:Category[]=[]) {

  const categories = cats

  // Create an inline keyboard, 2 columns
  return Markup.inlineKeyboard(
    categories.map((c) => Markup.button.callback(c.name, `cat_${c.id}`)),
    { columns: 2 }
  );
}

function paymentKeyboard(cat:Category) {
  return Markup.inlineKeyboard([
    Markup.button.callback(`پرداخت ${cat.price} دلار`, `pay_${cat.id}`),
  ]);
}

/**
 * Get downloadable file URL from Telegram using file_id
 * Note: This returns the HTTP file path to download file from Telegram servers.
 */
async function getTelegramFileUrl(fileId: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const resp = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  );
  const data = await resp.json();
  if (!data.ok) throw new Error("Failed to get file path from Telegram");
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

// ---------- Handlers ----------

// /start - show categories
bot.start(async (ctx) => {
    const from = ctx.from;
    if (!from) return ctx.reply("❌ خطا در شناسایی کاربر.");
  
    // save or update user in DB
    const user = await userRepo.createOrUpdate({
      telegramId: from.id,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
    });
  
    //fetch categories from DB
    const categories = await catRepo.findAll();


    // store userId in session for later use
    ctx.session = { ...(ctx.session || {}), userId: user.id };
  
    await ctx.reply("👋 سلام! لطفاً یک دسته‌بندی تبلیغ انتخاب کن:", categoryKeyboard(categories));
  });
  

// category selection via inline button callback
bot.action(/^cat_(\d+)$/, async (ctx) => {
  const matched = ctx.match && ctx.match[1];
  if (!matched) {
    await ctx.answerCbQuery("Invalid category");
    return;
  }
  const categoryId = Number(matched);
  const chosenCat = await catRepo.findById(categoryId);
  // store chosen category in session
  ctx.session = { ...(ctx.session || {}), categoryId };
  await ctx.answerCbQuery("Category selected ✅");
  await ctx.reply("دسته‌بندی انتخاب شد. لطفاً برای ادامه پرداخت را انجام دهید.", paymentKeyboard(chosenCat as Category));
})

// payment action
bot.action(/^pay_(\d+)$/, async (ctx) => {
  const matched = ctx.match && ctx.match[1];
  if (!matched) {
    await ctx.answerCbQuery("Invalid category");
    return;
  }
  const categoryId = Number(matched);
  const userId = ctx.session?.userId;
    if (!userId) {
    await ctx.reply("لطفاً ابتدا /start را بفرستید تا ثبت شوید.");
    return;
    }
  try {
    const cat = await catRepo.findById(categoryId);
    if (!cat) {
      await ctx.answerCbQuery("Invalid category");
      return;
    }
    // Process payment (fake)
    const paymentResult = await processPayment.execute({
      userId,
      amount: cat.price,
      method: "fake", // in real case, you'd have different methods
    });
    if (paymentResult) {
      // mark session as paid
      ctx.session = { ...(ctx.session || {}), paid: true };
      await ctx.answerCbQuery("Payment successful ✅");
      await ctx.reply("پروسه پرداخت شروع گردید! تراکنش را تایید کنید !.",Markup.inlineKeyboard([
        Markup.button.callback('تایید پرداخت', `verify_${cat.id}`)
      ]));
      
    } else {
      await ctx.answerCbQuery("Payment failed ❌");
      await ctx.reply("پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.");
    }
  } catch (err) {
    console.error("Payment error:", err);
    await ctx.answerCbQuery("Payment error ❌");
    await ctx.reply("خطا در پردازش پرداخت. لطفاً دوباره تلاش کنید.");
  }
});

// Verify payment action
bot.action(/^verify_(\d+)$/, async (ctx) => {
  const matched = ctx.match && ctx.match[1];
  if (!matched) return ctx.answerCbQuery("Invalid category");

  const categoryId = Number(matched);
  ctx.session = { ...(ctx.session || {}), categoryId, paid: true };

  await ctx.answerCbQuery("Payment verified ✅");
  await ctx.reply(
    "پرداخت شما تأیید شد. لطفاً زمان انتشار تبلیغ را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⏰ انتشار فوری", "schedule_immediate")],
      [Markup.button.callback("🗓 انتخاب ساعت خاص", "schedule_custom")],
      
    ])
  );
});

//Markdown rebuild function
function buildMarkdown(text: string, entities: any[] = []): string {
  if (!entities.length) return text;

  let result = "";
  let cursor = 0;

  for (const e of entities) {
    // قبل از استایل، متن عادی رو اضافه کن
    result += text.slice(cursor, e.offset);
    const segment = text.substr(e.offset, e.length);

    switch (e.type) {
      case "bold":
        result += `**${segment}**`;
        break;
      case "italic":
        result += `_${segment}_`;
        break;
      case "underline":
        result += `__${segment}__`;
        break;
      case "code":
        result += `\`${segment}\``;
        break;
      case "text_link":
        result += `[${segment}](${e.url})`;
        break;
      default:
        result += segment;
    }

    cursor = e.offset + e.length;
  }

  result += text.slice(cursor);
  return result;
}

// Choose publish time
bot.action(/^schedule_(immediate|custom)$/, async (ctx) => {
  const choice = ctx.match?.[1];
  if (!choice) return ctx.answerCbQuery("Invalid option");

  if (choice === "immediate") {
    const startAt = new Date();
    const endAt = new Date(Date.now() + 5 * 60 * 1000);
    ctx.session = { ...(ctx.session || {}), startAt, endAt };
    await ctx.reply("زمان انتشار تنظیم شد: هم‌اکنون.");
    await ctx.reply("حالا لطفاً محتوای تبلیغ (متن یا عکس) را ارسال کنید.");
  }

  if (choice === "custom") {
    ctx.session = { ...(ctx.session || {}), waitingForTime: true };
    await ctx.reply("لطفاً زمان انتشار را به فرمت زیر وارد کنید:\n\n📅 `YYYY-MM-DD HH:mm`\nمثلاً: `2025-10-07 14:30`", {
      parse_mode: "Markdown",
    });
  }
});

// generic message handler (text, photo, caption)
// Use ctx.update.message to be safe with union types
bot.on("message", async (ctx) => {
  const session = ctx.session;
  const categoryId = session?.categoryId;
  const userId = ctx.session?.userId;
    if (!userId) {
    await ctx.reply("لطفاً ابتدا /start را بفرستید تا ثبت شوید.");
    return;
    }
  if (!categoryId) {
    await ctx.reply("ابتدا دسته‌بندی را انتخاب کنید (use /start).");
    return;
  }

  // if user is entering custom time
  if (ctx.session?.waitingForTime) {
    const updateMsg = ctx.update && (ctx.update as any).message;
    const text = updateMsg.text?.trim();
    if (!text) {
      await ctx.reply("لطفاً زمان را به درستی وارد کنید.");
      return;
    }

    const date = new Date(text.replace(" ", "T")); // convert to ISO-like
    if (isNaN(date.getTime())) {
      await ctx.reply("❌ فرمت زمان اشتباه است. از فرمت YYYY-MM-DD HH:mm استفاده کنید.");
      return;
    }

    const startAt = date;
    const endAt = new Date(startAt.getTime() + 5 * 60 * 1000);

    ctx.session = {
      ...(ctx.session || {}),
      startAt,
      endAt,
      waitingForTime: false,
    };

    await ctx.reply(`✅ زمان انتشار تنظیم شد برای: ${startAt.toLocaleString("fa-IR")}`);
    await ctx.reply("حالا لطفاً محتوای تبلیغ (متن یا عکس) را ارسال کنید.");
    return;
  }

  // safe access to the incoming update message
  const updateMsg = ctx.update && (ctx.update as any).message;
  if (!updateMsg) {
    await ctx.reply("No message payload found.");
    return;
  }

  // extract text or caption
  let  content: string = typeof updateMsg.text === "string"
    ? updateMsg.text
    : typeof updateMsg.caption === "string"
    ? updateMsg.caption
    : "";

    // // Markdown entities ( not working perfectly yet)

    // let entities = [];

    // if (updateMsg.text) {
    //   content = buildMarkdown(updateMsg.text, updateMsg.entities);
    // } else if (updateMsg.caption) {
    //   content = buildMarkdown(updateMsg.caption, updateMsg.caption_entities);
    // }

  // check photos array if present
  let imageUrl: string | null = null;
  let fileId:string|null = null;
  if (Array.isArray(updateMsg.photo) && updateMsg.photo.length > 0) {
    // get the largest size (last item)
    const largestPhoto = updateMsg.photo[updateMsg.photo.length - 1];
    fileId = largestPhoto.file_id;
    try {
      imageUrl = await getTelegramFileUrl(fileId!);
    } catch (err) {
      console.error("Failed to get telegram file url:", err);
    }
  }

  // Example: create ad scheduled 2 minutes from now, end after 5 minutes
  const startAt = ctx.session?.startAt || new Date();
  const endAt = ctx.session?.endAt || new Date(Date.now() + 5 * 60 * 1000);

  // Persist ad via use-case
  try {
    const ad = await createAd.execute({
        messageId: null, // will be set after posting to channel
      content,
      imageUrl:fileId,
        categoryId,
      //userId: ctx.from?.id as number, // ensure user id exists
      userId, 
      startAt,
      endAt,
      verified: true, // auto-verified for this example
        receiptText: null,
        receiptUrl: null,
    });
    await scheduler.execute(ad);
    await ctx.reply(`✅ تبلیغ شما ذخیره شد (ID: ${ad.id}).`);
    // optionally clear session category so user must re-select next ad
    ctx.session = {};
  } catch (err: any) {
    console.error("CreateAd error:", err);
    await ctx.reply("خطا در ذخیره تبلیغ: " + (err.message || "unknown"));
  }
});

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// start bot
bot.launch().then(() => console.log("🤖 Telegram bot is running"));
