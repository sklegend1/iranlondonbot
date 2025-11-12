import { text } from 'stream/consumers';
// src/presentation/scenes/createAdScene.ts
import { Scenes, Markup } from "telegraf";
import { MyContext } from "../types/MyContext";
import { PrismaCategoryRepository } from "../../infrastructure/db/repositories/PrismaCategoryRepository";
import { PrismaAdRepository } from "../../infrastructure/db/repositories/PrismaAdRepository";
import { CreateAd } from "../../application/use-cases/CreateAd";
import { ScheduleAdJobs } from "../../infrastructure/queue/ScheduleAdJobs";
import { Category } from "@prisma/client";
import { PrismaUserRepository } from "../../infrastructure/db/repositories/PrismaUserRepository";
import { PrismaBotSettingRepository } from "../../infrastructure/db/repositories/PrismaBotSettingRepository";

const catRepo = new PrismaCategoryRepository();
const adRepo = new PrismaAdRepository();
const createAd = new CreateAd(adRepo);
const scheduler = new ScheduleAdJobs();
const userRepo = new PrismaUserRepository();
const botSettingRepo = new PrismaBotSettingRepository();
function mainMenuKeyboard() {
  return Markup.keyboard([["🏠 بازگشت به منو"]]).resize();
}

function categoriesKeyboard(categories: Category[]) {
  const rows = categories.map(c => [c.name]);
  rows.push(["🏠 بازگشت به منو"]);
  return Markup.keyboard(rows).resize();
}

export const createAdScene = new Scenes.WizardScene<any>(
  "CREATE_AD_SCENE",

  // ─────────────── مرحله ۱: انتخاب دسته‌بندی
  async (ctx) => {
    const cats = await catRepo.findAll();
    ctx.wizard.state.categories = cats;
    const validCategories = cats.filter((cat) => cat.id !== undefined) as { name: string; id: number; price: number }[];
    await ctx.reply("📂 لطفاً دسته‌بندی تبلیغ را انتخاب کن:", categoriesKeyboard(validCategories));
    return ctx.wizard.next();
  },

  // ─────────────── مرحله ۲: وارد کردن محتوای تبلیغ
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();
    if (text === "🏠 بازگشت به منو") return ctx.scene.leave();

    const cats = ctx.wizard.state.categories as Category[];
    const cat = cats.find(c => c.name === text);
    if (!cat) return ctx.reply("❌ گزینه نامعتبر است. لطفاً از لیست انتخاب کن.");

    ctx.wizard.state.categoryId = cat.id;
    ctx.wizard.state.categoryPrice = cat.price;
    await ctx.reply("✍️ لطفاً محتوای تبلیغ را بنویس یا تصویر ارسال کن:", mainMenuKeyboard());
    return ctx.wizard.next();
  },

  // ─────────────── مرحله ۳: دریافت محتوای تبلیغ
  async (ctx) => {
    if (!ctx.message) return;

    if ("text" in ctx.message && ctx.message.text === "🏠 بازگشت به منو")
      return ctx.scene.leave();

    let content = "";
    let fileId: string | null = null;

    if ("text" in ctx.message && ctx.message.text) {
      content = ctx.message.text;
    } else if ("photo" in ctx.message && ctx.message.photo?.length) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      content = ctx.message.caption || "";
    }

    ctx.wizard.state.content = content;
    ctx.wizard.state.fileId = fileId;

    await ctx.reply(
      "⏰ لطفاً زمان انتشار را انتخاب کنید:",
      Markup.keyboard([
        ["📤 انتشار فوری", "🗓 زمان‌بندی دستی"],
        ["🏠 بازگشت به منو"],
      ]).resize()
    );
    return ctx.wizard.next();
  },

  // ─────────────── مرحله ۴: تعیین زمان
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();
    const msg = await botSettingRepo.getValue("ad_message");
    if (text === "📤 انتشار فوری") {
      const startAt = new Date(Date.now());
      const endAt = new Date(Date.now() + (30 * 24 * 60 * 1000));
      ctx.wizard.state.startAt = startAt;
      ctx.wizard.state.endAt = endAt;
      const { categoryPrice } = ctx.wizard.state as any;
    await ctx.reply(
      `💳 مبلغ پرداخت برای این دسته‌بندی: *${categoryPrice} £*\n\n ${msg?.value} \n\n رسید پرداخت (عکس یا متن) را ارسال نمایید`,
      { parse_mode: "Markdown", ...mainMenuKeyboard() }
    );
      return ctx.wizard.selectStep(6);
    }

    if (text === "🗓 زمان‌بندی دستی") {
      await ctx.reply("🕐 لطفاً زمان انتشار را به فرمت زیر بنویس:\n\n`YYYY-MM-DD HH:mm`", {
        parse_mode: "Markdown",
      });
      return ctx.wizard.selectStep(5);
    }

    if (text === "🏠 بازگشت به منو") {
      await ctx.reply("بازگشت به منوی اصلی ✅",mainMenuKeyboard().resize().persistent());
      return ctx.scene.leave();
    }
    await ctx.reply("گزینه نامعتبر است.");
  },

  // ─────────────── مرحله ۵: وارد کردن زمان سفارشی
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();

    const date = new Date(text.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      await ctx.reply("❌ فرمت نادرست. مثال: 2025-10-21 18:30");
      return;
    }

    const startAt = date;
    const endAt = new Date(startAt.getTime() + 5 * 60 * 1000);
    ctx.wizard.state.startAt = startAt;
    ctx.wizard.state.endAt = endAt;

    // حالا بریم مرحله پرداخت
    return ctx.wizard.next();
  },

  // ─────────────── مرحله ۶: پرداخت
  async (ctx) => {
    const { categoryPrice } = ctx.wizard.state as any;
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();

    const date = new Date(text.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      await ctx.reply("❌ فرمت نادرست. مثال: 2025-10-21 18:30");
      return;
    }
    const msg = await botSettingRepo.getValue("ad_message");
    const startAt = date;
    const endAt = new Date(startAt.getTime() + 5 * 60 * 1000);
    ctx.wizard.state.startAt = startAt;
    ctx.wizard.state.endAt = endAt;
    await ctx.reply(
      `💳 مبلغ پرداخت برای این دسته‌بندی: *${categoryPrice} £*\n\n ${msg?.value} \n\n رسید پرداخت (عکس یا متن) را ارسال نمایید`,
      { parse_mode: "Markdown", ...mainMenuKeyboard() }
    );
    return ctx.wizard.next();
  },

  // ─────────────── مرحله ۷: دریافت رسید پرداخت
  async (ctx) => {
    if (!ctx.message) return;

    if ("text" in ctx.message && (ctx.message.text === "🏠 بازگشت به منو" || ctx.message.text === "/start"))
      return ctx.scene.leave();

    let receiptUrl: string | null = null;
    let receiptText: string | null = null;

    if ("photo" in ctx.message && ctx.message.photo?.length) {
      receiptUrl = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      receiptText = ctx.message.caption || "";
    } else if ("text" in ctx.message) {
      receiptText = ctx.message.text;
    }

    ctx.wizard.state.receiptUrl = receiptUrl;
    ctx.wizard.state.receiptText = receiptText;

   
    const { categoryId, content, fileId, startAt, endAt } = ctx.wizard.state as any;
    const userId = await userRepo.findByTelegramId(ctx.from?.id) ;
    if (!userId) return ctx.reply("❌ خطا در شناسایی کاربر.");

    try {
      const ad = await createAd.execute({
        messageId: null,
        content,
        imageUrl: fileId,
        categoryId,
        userId: userId.id,
        startAt,
        endAt,
        verified: false, // در انتظار تایید ادمین
        receiptUrl,
        receiptText,
      });

      const unverified = await adRepo.findUnverifiedAds();
      if(!unverified) 
      {
        await ctx.reply("✅ تبلیغ ثبت شد و در انتظار تأیید ادمین است.", mainMenuKeyboard());
        return ctx.scene.leave();
      }
      const unverifiedCount = unverified.length;
      const admins = await userRepo.findAdmins();

      for (const admin of admins) {
        if (!admin.telegramId) continue;
      
        await ctx.telegram.sendMessage(
          admin.telegramId.toString(),
          `📣 یک تبلیغ جدید ثبت شد و منتظر تایید است.\n
      🔢 تعداد تبلیغات تایید نشده: *${unverifiedCount}*
      ✅ برای مدیریت سفارشات روی دکمه زیر کلیک کنید.`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "🔧 مدیریت سفارشات",
                  "ADMIN_VERIFY_ADS" // باید توی bot command handler هندل بشه
                ),
              ],
            ]),
          }
        );
      }
      

      await ctx.reply("✅ تبلیغ ثبت شد و در انتظار تأیید ادمین است.", mainMenuKeyboard());
    } catch (err: any) {
      await ctx.reply("❌ خطا در ذخیره تبلیغ: " + (err.message || "نامشخص"));
    }

    await ctx.scene.leave();
  }
);
