// src/presentation/scenes/botSettingsScene.ts
import { Scenes, Markup } from "telegraf";
import { MyContext } from "../types/MyContext";
import { PrismaBotSettingRepository } from "../../infrastructure/db/repositories/PrismaBotSettingRepository";
import { PrismaUserRepository } from "../../infrastructure/db/repositories/PrismaUserRepository";
import { PrismaTargetGroupRepository } from "../../infrastructure/db/repositories/PrismaTargetGroupRepository";

const settingRepo = new PrismaBotSettingRepository();
const userRepo = new PrismaUserRepository();
const targetRepo = new PrismaTargetGroupRepository();
function mainSettingsKeyboard() {
  return Markup.keyboard([
    ["👑 افزودن ادمین", "📋 لیست ادمین‌ها"],
    ["🔗 گروه‌های مرجع دعوت", "💬 گروه‌های ما"],
    ["📢 کانال اصلی", "💬 پیام‌های خودکار"],
    ["⚙️ وضعیت ربات مدیریت گروه"],
    ["🏠 بازگشت به منوی اصلی"]
  ]).resize();
}

async function handleAddAdmin(ctx: any, text: string) {
    const current = await settingRepo.getValue("admins");
    const admins = current ? JSON.parse(current.value) : [];
    const curUser = await userRepo.findByTelegramId(ctx.from?.id);
    if (admins.includes(text)) {
      await ctx.reply("⚠️ این ادمین از قبل ثبت شده است.", mainSettingsKeyboard());
      ctx.scene.state = {};
      return;
    }
  
    admins.push(text);
    await settingRepo.upsert("admins", JSON.stringify(admins),curUser?.id );
    await userRepo.createOrUpdate({telegramId: Number(text) , isAdmin:true} );
    await ctx.reply(`✅ ادمین جدید با شناسه ${text} افزوده شد.`, mainSettingsKeyboard());
    ctx.scene.state = {};
  }
  
  async function handleGroupList(ctx: any, text: string, key: string) {
    const current = await settingRepo.getValue(key);
    let groups = current ? JSON.parse(current.value) : [];
  
    let targets = await targetRepo.findAll();

    if (text.startsWith("حذف")) {
      const name = text.replace("حذف", "").trim();
      groups = groups.filter((g: string) => g !== name);
      await ctx.reply(`🗑 گروه "${name}" حذف شد.`);
    } else {
      groups.push(text);
      await ctx.reply(`✅ گروه "${text}" افزوده شد.`);
    }
    const curUser = await userRepo.findByTelegramId(ctx.from?.id);
    await settingRepo.upsert(key, JSON.stringify(groups),curUser?curUser.id :0 );
    if(key==="our_groups"){
        await targetRepo.upsertGroup({key:text})
    }
    ctx.scene.state = {};
  }
  

export const botSettingsScene = new Scenes.BaseScene<any>("BOT_SETTINGS_SCENE");

botSettingsScene.enter(async (ctx) => {
  await ctx.reply("⚙️ تنظیمات عمومی بات:", mainSettingsKeyboard());
});

botSettingsScene.hears("🏠 بازگشت به منوی اصلی", async (ctx) => {
  await ctx.reply("بازگشت به منوی اصلی ✅");
  await ctx.scene.leave();
});

// ✅ افزودن ادمین
botSettingsScene.hears("👑 افزودن ادمین", async (ctx) => {
  await ctx.reply("لطفاً آیدی عددی کاربر (telegramId) ادمین جدید را ارسال کن:");
  ctx.scene.state.waitingFor = "add_admin";
});

// ✅ لیست ادمین‌ها
botSettingsScene.hears("📋 لیست ادمین‌ها", async (ctx) => {
  const admins = await settingRepo.getValue("admins");
  const list = admins ? JSON.parse(admins.value) : [];
  if (!list.length) {
    await ctx.reply("فعلاً هیچ ادمینی ثبت نشده.");
    return;
  }
  await ctx.reply(`👥 لیست ادمین‌ها:\n${list.map((id: string) => `• ${id}`).join("\n")}`);
});

// ✅ گروه‌های مرجع دعوت
botSettingsScene.hears("🔗 گروه‌های مرجع دعوت", async (ctx) => {
    const groups = await settingRepo.getValue("ref_groups");
    const list = groups ? JSON.parse(groups.value) : [];
    if (!list.length) {
      await ctx.reply("فعلاً هیچ گروهی ثبت نشده.");
      
    }
    else await ctx.reply(`👥 لیست گروه‌های مرجع دعوت:\n${list.map((g: string) => `• ${g}`).join("\n")}`);
  await ctx.reply("لطفاً لینک یا @ی گروه مرجع را وارد کن (برای حذف بنویس حذف <نام>):");
  ctx.scene.state.waitingFor = "ref_groups";
});

// ✅ گروه‌های ما
botSettingsScene.hears("💬 گروه‌های ما", async (ctx) => {
    const groups = await settingRepo.getValue("our_groups");
    const list = groups ? JSON.parse(groups.value) : [];
    if (!list.length) {
      await ctx.reply("فعلاً هیچ گروهی ثبت نشده.");
      
    }
    else await ctx.reply(`👥 لیست گروه‌های ما:\n${list.map((g: string) => `• ${g}`).join("\n")}`);
  await ctx.reply("لطفاً آی دی گروه خود را وارد کن (برای حذف بنویس حذف <نام>):");
  ctx.scene.state.waitingFor = "our_groups";
});

// ✅ کانال اصلی
botSettingsScene.hears("📢 کانال اصلی", async (ctx) => {
  await ctx.reply("لطفاً یوزرنیم یا لینک کانال اصلی را ارسال کن:");
  ctx.scene.state.waitingFor = "main_channel";
});

// ✅ پیام‌های خودکار
botSettingsScene.hears("💬 پیام‌های خودکار", async (ctx) => {
  await ctx.reply("چه پیامی را می‌خواهی تنظیم کنی؟", Markup.keyboard([
    ["📩 پیام خوش‌آمد", "📢 پیام پرداخت تبلیغات"],
    ["🏠 بازگشت به منوی اصلی"]
  ]).resize());
  ctx.scene.state.waitingFor = "auto_message_select";
});

// ✅ وضعیت ربات مدیریت گروه
botSettingsScene.hears("⚙️ وضعیت ربات مدیریت گروه", async (ctx) => {
  const status = await settingRepo.getValue("group_bot_enabled");
  const isEnabled = status?.value === "true";
  const toggleKeyboard = Markup.keyboard([
    [isEnabled ? "🔴 غیرفعال‌سازی" : "🟢 فعال‌سازی"],
    ["🏠 بازگشت به منوی اصلی"]
  ]).resize();

  await ctx.reply(`وضعیت فعلی: ${isEnabled ? "✅ فعال" : "❌ غیرفعال"}`, toggleKeyboard);
  ctx.scene.state.waitingFor = "toggle_group_bot";
});

// ✅ هندل پیام‌های ورودی
botSettingsScene.on("text", async (ctx) => {
  const { waitingFor } = ctx.scene.state;
  const text = ctx.message.text.trim();
  if (text === '/start'){
    ctx.scene.state = {};
    ctx.scene.leave();

    return;
  }
  const curUser = await userRepo.findByTelegramId(ctx.from?.id);
  if (!waitingFor) return;

  switch (waitingFor) {
    case "add_admin":
      await handleAddAdmin(ctx, text);
      break;

    case "ref_groups":
      await handleGroupList(ctx, text, "ref_groups");
      break;

    case "our_groups":
      await handleGroupList(ctx, text, "our_groups");
      break;

    case "main_channel":
      await settingRepo.upsert("main_channel", text,curUser?curUser.id :0 );
      await ctx.reply("✅ کانال اصلی ذخیره شد.", mainSettingsKeyboard());
      ctx.scene.state = {};
      break;

    case "toggle_group_bot":
      if (text.includes("فعال")) {
        await settingRepo.upsert("group_bot_enabled", text.includes("غیرفعال") ? "false" : "true",curUser?curUser.id :0 );
        await ctx.reply(`✅ وضعیت جدید: ${text.includes("غیرفعال") ? "❌ غیرفعال" : "✅ فعال"}`);
      }
      ctx.scene.state = {};
      return ctx.reply("بازگشت به منوی اصلی ✅", mainSettingsKeyboard());
      break;

    case "auto_message_select":
        if (text === "🏠 بازگشت به منوی اصلی") {
            await ctx.reply("بازگشت به منوی اصلی ✅", mainSettingsKeyboard());
            ctx.scene.state = {};
            return;
        }
        if (text === "📩 پیام خوش‌آمد" || text === "📢 پیام پرداخت تبلیغات") {
            const key = text === "📩 پیام خوش‌آمد" ? "welcome_message" : "ad_message";
            await ctx.reply(`لطفاً متن پیام خودکار (${text}) را ارسال کن:`);
            ctx.scene.state.waitingFor = key;
        } else {
            await ctx.reply("❌ گزینه نامعتبر است. لطفاً یکی از گزینه‌ها را انتخاب کن.");
        }
        break;

    case "welcome_message":
        await settingRepo.upsert(waitingFor, text,curUser?curUser.id :0 );
        await ctx.reply("✅ پیام خودکار ذخیره شد.", mainSettingsKeyboard());
        ctx.scene.state = {};
        break;

    case "ad_message":
        await settingRepo.upsert(waitingFor, text,curUser?curUser.id :0 );
        await ctx.reply("✅ پیام خودکار ذخیره شد.", mainSettingsKeyboard());
        ctx.scene.state = {};
        break;
  }
});
