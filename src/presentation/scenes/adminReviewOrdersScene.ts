import { Scenes, Markup } from "telegraf";
import { MyContext } from "../types/MyContext";
import { PrismaAdRepository } from "../../infrastructure/db/repositories/PrismaAdRepository";
import { format } from "date-fns-jalali";
import { ScheduleAdJobs } from "../../infrastructure/queue/ScheduleAdJobs";
import { mainMenuKeyboard } from "../adminBot";

const adRepo = new PrismaAdRepository();
const scheduler = new ScheduleAdJobs();
export const adminReviewOrdersScene = new Scenes.BaseScene<any>("ADMIN_REVIEW_ORDERS_SCENE");

// وقتی وارد صحنه می‌شود
adminReviewOrdersScene.enter(async (ctx) => {
  await ctx.reply("🔍 در حال دریافت سفارشات در انتظار تأیید...");
  
  const pendingAds = await adRepo.findUnverifiedAds();

  if (!pendingAds.length) {
    await ctx.reply("✅ هیچ سفارشی در انتظار بررسی نیست.", Markup.keyboard([["🏠 بازگشت به منوی اصلی"]]).resize());
    return;
  }

  ctx.scene.session.pendingAds = pendingAds;
  ctx.scene.session.index = 0;

  await showAd(ctx);
});

// تابع نمایش آگهی جاری برای بررسی
async function showAd(ctx: any) {
  const ads = ctx.scene.session.pendingAds;
  const i = ctx.scene.session.index || 0;
  const ad = ads[i];

  if (!ad) {
    await ctx.reply("✅ همه سفارشات بررسی شدند.", Markup.keyboard([["🏠 بازگشت به منوی اصلی"]]).resize());
    await ctx.scene.leave();
    return;
  }

  const start = format(ad.startAt, "yyyy-MM-dd HH:mm");
  const end = format(ad.endAt, "yyyy-MM-dd HH:mm");

  let msg = `📢 *سفارش #${ad.id}*\n`;
  msg += `👤 کاربر: ${ad.userId}\n`;
  msg += `📂 دسته: ${ad.categoryId}\n`;
  msg += `🗓 از ${start} تا ${end}\n\n`;
  msg += `📝 محتوا:\n${ad.content}\n`;

  if (ad.receiptText || ad.receiptUrl) {
    msg += `\n📎 رسید پرداخت:\n`;
    if (ad.receiptText) msg += `🧾 ${ad.receiptText}\n`;
    if (ad.receiptUrl) msg += `🔗 ${ad.receiptUrl}`;
  } else {
    msg += `\n⚠️ رسید پرداختی ارسال نشده است.`;
  }

  const buttons = [
    ["✅ تأیید تبلیغ", "❌ رد تبلیغ"],
    ["⏭ تبلیغ بعدی", "🏠 بازگشت به منوی اصلی"],
  ];

  if (ad.imageUrl) {
    await ctx.replyWithPhoto(ad.imageUrl, { caption: msg,  ...Markup.keyboard(buttons).resize() });
  } else {
    await ctx.reply(msg, {  ...Markup.keyboard(buttons).resize() });
  }
  if(ad.receiptUrl){
    await ctx.replyWithPhoto(ad.receiptUrl);
  }
}

// وقتی ادمین یکی از گزینه‌ها را انتخاب می‌کند
adminReviewOrdersScene.on("text", async (ctx) => {
  const text = ctx.message.text;
  const ads = ctx.scene.session.pendingAds;
  let i = ctx.scene.session.index || 0;
  const ad = ads[i];

  switch (text) {
    case "✅ تأیید تبلیغ":
      await adRepo.update( {...ad , verified: true });
      await scheduler.execute(ad);
      await ctx.reply("✅ تبلیغ تأیید و فعال شد.");
      i++;
      ctx.scene.session.index = i;
      await showAd(ctx);
      break;

    case "❌ رد تبلیغ":
      await adRepo.delete(ad.id);
      await ctx.reply("🚫 تبلیغ رد و حذف شد.");
      i++;
      ctx.scene.session.index = i;
      await showAd(ctx);
      break;

    case "⏭ تبلیغ بعدی":
      i++;
      ctx.scene.session.index = i;
      await showAd(ctx);
      break;

    case "🏠 بازگشت به منوی اصلی":
      await ctx.scene.leave();
      await ctx.reply("بازگشت به منوی اصلی ادمین.", mainMenuKeyboard().resize());
      break;

    default:
      await ctx.reply("❌ گزینه نامعتبر است.");
      break;
  }
});
