import { Scenes, Markup } from "telegraf";
import { MyContext } from "../types/MyContext";
import { PrismaAdRepository } from "../../infrastructure/db/repositories/PrismaAdRepository";
import { PrismaCategoryRepository } from "../../infrastructure/db/repositories/PrismaCategoryRepository";
import { CreateAd } from "../../application/use-cases/CreateAd";
import { PrismaUserRepository } from "../../infrastructure/db/repositories/PrismaUserRepository";

const catRepo = new PrismaCategoryRepository();
const adRepo = new PrismaAdRepository();
const createAd = new CreateAd(adRepo);
const userRepo = new PrismaUserRepository();
export const renewAdScene = new Scenes.WizardScene<any>(
  "RENEW_AD_SCENE",

  // مرحله ۱: انتخاب آگهی برای تمدید
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    const text = ctx.message.text.trim();
    if (text === "🏠 بازگشت به منو") return ctx.scene.enter("NORMAL_USER_SCENE");

    const matchedId = text.match(/#(\d+)/);
    if (!matchedId) {
      await ctx.reply("❌ لطفاً یکی از آگهی‌های فعال را از لیست انتخاب کن.");
      return;
    }
    const cats = await catRepo.findAll();
    ctx.wizard.state.categories = cats;
    
    const adId = Number(matchedId[1]);
    const ad = await adRepo.findById(adId);
    const categoryPrice = cats.find(c => c.id === ad?.categoryId)?.price || 0;
    ctx.wizard.state.adId = adId;
    await ctx.reply(
      `💳 مبلغ پرداخت برای این دسته‌بندی: *${categoryPrice} $*\n\nلطفاً مبلغ را به شماره کارت زیر واریز کنید و سپس رسید پرداخت (عکس یا متن) را ارسال نمایید.\n\n🏦 1234-5678-9012-3456 به نام "ربات تبلیغات"`,
      Markup.keyboard([
        
        ["🏠 بازگشت به منو"],
      ]).resize()
    );
      
    
    return ctx.wizard.next();
  },

  // مرحله ۲: انتخاب مدت تمدید
  async (ctx) => {
    if (!ctx.message) return;

    if ("text" in ctx.message && ctx.message.text === "🏠 بازگشت به منو")
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
    const adId = ctx.wizard.state.adId;
    // const days = text.match(/(\d+)/);
    const days = 30;
    if (!days) return ctx.reply("❌ لطفاً مدت معتبر انتخاب کن.");

    const addDays = 30;
    const ad = await adRepo.findById(adId);
    if (!ad) return ctx.reply("❌ آگهی یافت نشد.");

    const newEnd = new Date(ad.endAt);
    newEnd.setDate(newEnd.getDate() + addDays);
    
   

    

    

   
    const { categoryId, content, imageUrl, startAt, endAt } = ad;
    const userId = await userRepo.findByTelegramId(ctx.from?.id) ;
    if (!userId) return ctx.reply("❌ خطا در شناسایی کاربر.");

    try {
      const newad = await createAd.execute({
        messageId: null,
        content,
        imageUrl: imageUrl,
        categoryId,
        userId: userId.id,
        startAt : endAt,
        endAt: new Date(new Date(endAt).getTime() + (addDays * 24 * 60 * 60 * 1000)),
        verified: false, // در انتظار تایید ادمین
        receiptUrl,
        receiptText,
      });
      await ctx.reply("✅  تمدید تبلیغ ثبت شد و در انتظار تأیید ادمین است.");
    }catch (err: any) {
      await ctx.reply("❌ خطا در ذخیره تبلیغ: " + (err.message || "نامشخص"));
    }

    
    
    await ctx.scene.enter("NORMAL_USER_SCENE");
  }
);
