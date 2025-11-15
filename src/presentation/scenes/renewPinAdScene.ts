import { Scenes, Markup } from "telegraf";
import { format } from "date-fns-jalali";
import { PrismaAdRepository } from "../../infrastructure/db/repositories/PrismaAdRepository";
import { PrismaUserRepository } from "../../infrastructure/db/repositories/PrismaUserRepository";
import { PrismaBotSettingRepository } from "../../infrastructure/db/repositories/PrismaBotSettingRepository";
import { MyContext } from "../types/MyContext";

const adRepo = new PrismaAdRepository();
const userRepo = new PrismaUserRepository();
const botSettingRepo = new PrismaBotSettingRepository();

function backKeyboard() {
  return Markup.keyboard([["🏠 بازگشت به منو"]]).resize();
}

async function getAdminIds(): Promise<string[]> {
  const adminIds = new Set<string>();
  const envAdmin = process.env.ADMIN_TELEGRAM_ID;
  if (envAdmin) {
    adminIds.add(envAdmin.toString());
  }

  const adminsSetting = await botSettingRepo.getValue("admins");
  if (adminsSetting?.value) {
    try {
      const parsed = JSON.parse(adminsSetting.value) as Array<string | number>;
      parsed.forEach((id) => {
        if (typeof id === "number") adminIds.add(id.toString());
        if (typeof id === "string" && id.trim()) adminIds.add(id.trim());
      });
    } catch (err) {
      console.error("Failed to parse admins list:", err);
    }
  }

  return Array.from(adminIds);
}

async function getPaymentMessage() {
  const pinMessage = await botSettingRepo.getValue("pin_message");
  if (pinMessage?.value) return pinMessage.value;

  const adMessage = await botSettingRepo.getValue("ad_message");
  if (adMessage?.value) return adMessage.value;

  return "💳 لطفاً مبلغ مربوط به پین کردن تبلیغ را واریز کرده و رسید پرداخت را به صورت عکس یا متن ارسال کن.";
}

export const renewPinAdScene = new Scenes.WizardScene<any>(
  "RENEW_PIN_AD_SCENE",

  // مرحله ۱: نمایش لیست تبلیغات تایید شده
  async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("❌ خطا در شناسایی کاربر.");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    const user = await userRepo.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply("❌ اطلاعات شما در سیستم یافت نشد. لطفاً دوباره /start را ارسال کن.");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    const ads = await adRepo.findManyByUserId(user.id);
    const eligibleAds = ads.filter((ad) => ad.verified && ad.messageId);

    if (!eligibleAds.length) {
      await ctx.reply("⏳ هیچ تبلیغ تاییدشده‌ای برای پین کردن وجود ندارد.");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    ctx.wizard.state.ads = eligibleAds;

    const rows = eligibleAds.map((ad) => [
      `#${ad.id} | ${format(ad.startAt, "MM/dd HH:mm")}`,
    ]);
    rows.push(["🏠 بازگشت به منو"]);

    await ctx.reply(
      "📌 لطفاً تبلیغی که می‌خواهی دوباره در کانال پین شود را انتخاب کن:",
      Markup.keyboard(rows).resize()
    );
    return ctx.wizard.next();
  },

  // مرحله ۲: تایید تبلیغ و توضیحات پرداخت
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();

    if (text === "🏠 بازگشت به منو") {
      await ctx.reply("بازگشت به منوی اصلی ✅");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    const matchedId = text.match(/#(\d+)/);
    if (!matchedId) {
      await ctx.reply("❌ لطفاً یکی از گزینه‌های لیست را انتخاب کن.");
      return;
    }

    const adId = Number(matchedId[1]);
    const ads = ctx.wizard.state.ads as any[];
    const selectedAd = ads?.find((ad) => ad.id === adId);

    if (!selectedAd) {
      await ctx.reply("❌ تبلیغ انتخاب‌شده معتبر نیست.");
      return;
    }

    ctx.wizard.state.selectedAd = selectedAd;
    const paymentMessage = await getPaymentMessage();

    await ctx.reply(
      `📌 تبلیغ شماره #${adId} برای پین شدن انتخاب شد.\nلطفاً مبلغ تعیین شده را پرداخت کرده و رسید را ارسال کن.\n\n${paymentMessage}`,
      { ...backKeyboard() }
    );

    return ctx.wizard.next();
  },

  // مرحله ۳: دریافت رسید و ارسال به ادمین
  async (ctx) => {
    if (!ctx.message) return;

    if ("text" in ctx.message && ctx.message.text === "🏠 بازگشت به منو") {
      await ctx.reply("بازگشت به منوی اصلی ✅");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    const selectedAd = ctx.wizard.state.selectedAd;
    if (!selectedAd) {
      await ctx.reply("❌ تبلیغی انتخاب نشده است. دوباره تلاش کن.");
      return ctx.scene.enter("NORMAL_USER_SCENE");
    }

    const receiptText =
      "caption" in ctx.message && ctx.message.caption
        ? ctx.message.caption
        : "text" in ctx.message
        ? ctx.message.text
        : "";

    if (
      !(
        ("photo" in ctx.message && ctx.message.photo?.length) ||
        ("document" in ctx.message && ctx.message.document) ||
        ("text" in ctx.message && ctx.message.text)
      )
    ) {
      await ctx.reply("❌ لطفاً متن یا تصویر رسید پرداخت را ارسال کن.");
      return;
    }

    const adminIds = await getAdminIds();
    if (!adminIds.length) {
      console.warn("No admin ID configured to receive pin requests.");
    }

    const start = format(selectedAd.startAt, "yyyy-MM-dd HH:mm");
    const end = format(selectedAd.endAt, "yyyy-MM-dd HH:mm");
    const user = ctx.from;

    const summary =
      `📌 درخواست جدید پین تبلیغ\n` +
      `👤 کاربر: ${user?.first_name ?? ""} ${user?.last_name ?? ""} (${user?.username ? `@${user.username}` : "بدون یوزرنیم"})\n` +
      `🆔 آیدی عددی: ${user?.id}\n` +
      `📢 تبلیغ #${selectedAd.id}\n` +
      `🕒 بازه انتشار: ${start} تا ${end}\n` +
      (receiptText ? `🧾 توضیحات رسید: ${receiptText}` : "");

    for (const adminId of adminIds) {
      try {
        await ctx.telegram.sendMessage(adminId, summary);
        await ctx.telegram.copyMessage(
          adminId,
          ctx.chat!.id,
          ctx.message.message_id
        );
      } catch (err) {
        console.error("Failed to notify admin about pin request:", err);
      }
    }

    await ctx.reply(
      "✅ درخواست پین تبلیغ ثبت شد. پس از بررسی نتیجه اطلاع‌رسانی می‌شود.",
      backKeyboard()
    );
    return ctx.scene.enter("NORMAL_USER_SCENE");
  }
);
