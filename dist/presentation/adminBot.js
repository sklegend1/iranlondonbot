"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBotStartHandler = void 0;
exports.setupAdminBot = setupAdminBot;
// src/presentation/adminBot.ts
require("dotenv/config");
const telegraf_1 = require("telegraf");
const client_1 = require("@prisma/client");
const BotSettingService_1 = require("../application/services/BotSettingService");
const rss_parser_1 = __importDefault(require("rss-parser"));
const sessions_1 = require("telegram/sessions");
const telegram_1 = require("telegram");
const createAdScene_1 = require("./scenes/createAdScene");
const PrismaCategoryRepository_1 = require("../infrastructure/db/repositories/PrismaCategoryRepository");
const PrismaUserRepository_1 = require("../infrastructure/db/repositories/PrismaUserRepository");
const date_fns_jalali_1 = require("date-fns-jalali");
const PrismaAdRepository_1 = require("../infrastructure/db/repositories/PrismaAdRepository");
const renewAdScene_1 = require("./scenes/renewAdScene");
const adminReviewOrdersScene_1 = require("./scenes/adminReviewOrdersScene");
const botSettingsScene_1 = require("./scenes/botSettingsScene");
const prisma = new client_1.PrismaClient();
const settingService = new BotSettingService_1.BotSettingService();
const rssParser = new rss_parser_1.default();
const catRepo = new PrismaCategoryRepository_1.PrismaCategoryRepository();
const userRepo = new PrismaUserRepository_1.PrismaUserRepository();
const adRepo = new PrismaAdRepository_1.PrismaAdRepository();
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID?.toString() || "";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
}
const adminBotStartHandler = async (ctx) => {
    const fromId = ctx.from?.id?.toString() ?? "";
    ctx.session = {};
    const curUser = await userRepo.findByTelegramId(ctx.from?.id);
    if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
        //await ctx.reply("⛔️ شما اجازه‌ی دسترسی به این ربات را ندارید.");
        //return;
        const from = ctx.from;
        if (!from)
            return ctx.reply("❌ خطا در شناسایی کاربر.");
        // save or update user in DB
        const user = await userRepo.createOrUpdate({
            telegramId: from.id,
            username: from.username,
            firstName: from.first_name,
            lastName: from.last_name,
        });
        await ctx.scene.enter("NORMAL_USER_SCENE");
    }
    else {
        await ctx.reply("👋 سلام ادمین! یکی از گزینه‌ها را انتخاب کن:", mainMenuKeyboard());
    }
};
exports.adminBotStartHandler = adminBotStartHandler;
// const bot = new Telegraf<MyContext>(BOT_TOKEN);
// middleware: session + stage
// Helper: main menu keyboard
function mainMenuKeyboard() {
    return telegraf_1.Markup.keyboard([
        ["📤 دعوت اعضا"],
        ["📥 اسکرپر", "📰 ارسال خبر"],
        ["📦 مدیریت سفارشات", "⏰ زمان‌بندی"],
        ["👥 اپراتورها", "⚙️ تنظیمات عمومی"],
    ])
        .resize()
        .persistent();
}
function backToMenuKeyboard() {
    return telegraf_1.Markup.keyboard([["↩️ بازگشت به منو"]]).resize();
}
async function showUserOrders(ctx) {
    const userId = ctx.from?.id;
    if (!userId) {
        await ctx.reply("❌ خطا در شناسایی کاربر.");
        return;
    }
    const sender = await userRepo.findByTelegramId(userId);
    if (!sender) {
        await ctx.reply("❌ خطا در شناسایی کاربر در پایگاه داده.");
        return;
    }
    const ads = await adRepo.findManyByUserId(sender?.id);
    if (!ads.length) {
        await ctx.reply("📭 هنوز هیچ تبلیغی ثبت نکردی.");
        return;
    }
    for (const ad of ads) {
        const status = ad.verified ? "✅ تأیید شده" : "⏳ در انتظار بررسی";
        const start = (0, date_fns_jalali_1.format)(ad.startAt, "yyyy-MM-dd HH:mm");
        const end = (0, date_fns_jalali_1.format)(ad.endAt, "yyyy-MM-dd HH:mm");
        let msg = `📢 *تبلیغ #${ad.id}*\n`;
        msg += `📂 دسته: ${ad.categoryId}\n`;
        msg += `📅 از: ${start}\nتا: ${end}\n`;
        msg += `🧾 وضعیت: ${status}`;
        if (ad.imageUrl) {
            await ctx.replyWithPhoto(ad.imageUrl, {
                caption: msg,
                parse_mode: "Markdown",
            });
        }
        else {
            await ctx.reply(msg, { parse_mode: "Markdown" });
        }
    }
}
async function startRenewProcess(ctx) {
    const userId = ctx.from?.id;
    if (!userId) {
        await ctx.reply("❌ خطا در شناسایی کاربر.");
        return;
    }
    const sender = await userRepo.findByTelegramId(userId);
    const ads = await adRepo.findManyByUserId(sender?.id);
    if (!ads.length) {
        await ctx.reply("📭 تبلیغی برای تمدید وجود ندارد.");
        return;
    }
    const activeAds = ads;
    if (!activeAds.length) {
        await ctx.reply("⏳ هیچ تبلیغ فعالی برای تمدید وجود ندارد.");
        return;
    }
    const buttons = activeAds.map(a => [`#${a.id} از ${(0, date_fns_jalali_1.format)(a.startAt, "MM/dd HH:mm")}`]);
    buttons.push(["🏠 بازگشت به منو"]);
    ctx.wizard = { adsToRenew: activeAds };
    await ctx.reply("🔁 لطفاً یکی از تبلیغات فعال را برای تمدید انتخاب کن:", telegraf_1.Markup.keyboard(buttons).resize());
    // تغییر صحنه به تمدید
    await ctx.scene.enter("RENEW_AD_SCENE");
}
function setupAdminBot(bot) {
    //console.log("bot mode : ",bot.context.state);
    // bot.use(async (ctx, next) => {
    //   if (ctx.chat?.type !== "private") return; // یعنی هیچی بعدش اجرا نشه
    //    console.log("Admin bot middleware check for chat type:", ctx.chat?.type);
    //    await next();
    // });
    bot.use((0, telegraf_1.session)());
    const stage = new telegraf_1.Scenes.Stage([createAdScene_1.createAdScene]); // scenes added below
    bot.use(stage.middleware());
    const normalUserScene = new telegraf_1.Scenes.BaseScene("NORMAL_USER_SCENE");
    // createAdScene.enter(async (ctx) => {
    //   const categories = await catRepo.findAll();
    //   const validCategories = categories.filter((cat) => cat.id !== undefined) as { name: string; id: number; price: number }[];
    //   const rows = validCategories.map((c) => [c.name]);
    //   rows.push(["🏠 بازگشت به منو"]);
    //   await ctx.reply("📂 لطفاً دسته‌بندی تبلیغ را انتخاب کن:", Markup.keyboard(rows).resize());
    // })
    // START handler resets session and shows menu
    bot.start(exports.adminBotStartHandler);
    // ---------- Scenes ----------
    normalUserScene.enter(async (ctx) => {
        await ctx.reply("گزینه مورد نظر را انتخاب کنید", telegraf_1.Markup.keyboard([["➕ سفارش تبلیغ جدید"], ["📋 سوابق سفارشات", "🔁 تمدید سفارش"]]).resize().persistent());
    });
    createAdScene_1.createAdScene.leave(async (ctx) => {
        bot.context.session = {};
        await ctx.wizard.selectStep(0);
        await ctx.scene.enter("NORMAL_USER_SCENE");
        console.log(ctx.scene.current);
    });
    bot.hears("➕ سفارش تبلیغ جدید", async (ctx) => {
        console.log("Entering to create ads");
        await ctx.scene.enter("CREATE_AD_SCENE");
    });
    bot.hears("📋 سوابق سفارشات", async (ctx) => {
        await showUserOrders(ctx);
        return;
    });
    bot.hears("🔁 تمدید سفارش", async (ctx) => {
        await startRenewProcess(ctx);
        return;
    });
    stage.register(createAdScene_1.createAdScene);
    stage.register(normalUserScene);
    stage.register(renewAdScene_1.renewAdScene);
    stage.register(adminReviewOrdersScene_1.adminReviewOrdersScene);
    stage.register(botSettingsScene_1.botSettingsScene);
    // Scraper Wizard
    const scraperScene = new telegraf_1.Scenes.BaseScene("SCRAPER_SCENE");
    scraperScene.enter(async (ctx) => {
        await ctx.reply("📰 مدیریت منابع RSS:\nیکی از گزینه‌ها را انتخاب کنید:", telegraf_1.Markup.keyboard([
            ["📋 فهرست منابع RSS", "➕ افزودن منبع RSS"],
            ["🔍 تست منابع", "✅ فعال‌سازی", "🔴 غیرفعال‌سازی"],
            ["↩️ بازگشت به منو"],
        ]).resize());
    });
    const addRssWizard = new telegraf_1.Scenes.WizardScene("ADD_RSS_WIZARD", async (ctx) => {
        await ctx.reply("📡 لطفاً آدرس RSS را وارد کنید:", backToMenuKeyboard());
        return ctx.wizard.next();
    }, async (ctx) => {
        if (!ctx.message || !("text" in ctx.message))
            return;
        const url = ctx.message.text.trim();
        let title = (await rssParser.parseURL(url)).title;
        if (!url.startsWith("http") || !title) {
            await ctx.reply("❌ آدرس واردشده معتبر نیست. دوباره تلاش کنید.");
            return;
        }
        // const user = await prisma.user.upsert({
        //   where: { telegramId: BigInt(ctx.from!.id) },
        //   create: { telegramId: BigInt(ctx.from!.id), username: ctx.from!.username ?? undefined },
        //   update: {},
        // });
        await prisma.rssSource.create({
            data: { url, title: title },
        });
        await ctx.reply("✅ منبع RSS با موفقیت افزوده شد.", mainMenuKeyboard());
        return ctx.scene.leave();
    });
    stage.register(addRssWizard);
    scraperScene.hears("➕ افزودن منبع RSS", async (ctx) => {
        await ctx.scene.enter("ADD_RSS_WIZARD");
    });
    scraperScene.hears("📋 فهرست منابع RSS", async (ctx) => {
        const sources = await prisma.rssSource.findMany({ orderBy: { id: "asc" } });
        if (sources.length === 0) {
            await ctx.reply("هیچ منبع RSS یافت نشد.", mainMenuKeyboard());
            return;
        }
        const list = sources.map((s) => `• ${s.title} ${s.active ? "✅" : "🔴"} \n  ${s.url}`).join("\n\n");
        await ctx.reply(`فهرست منابع RSS:\n\n${list}`, mainMenuKeyboard());
    });
    scraperScene.hears("🔍 تست منابع", async (ctx) => {
        const sources = await prisma.rssSource.findMany({ where: { active: true } });
        if (sources.length === 0) {
            await ctx.reply("⚠️ هیچ منبع فعالی یافت نشد.", mainMenuKeyboard());
            return;
        }
        await ctx.reply("⏳ در حال تست منابع RSS...");
        for (const src of sources) {
            try {
                const feed = await rssParser.parseURL(src.url);
                await prisma.rssSource.update({
                    where: { id: src.id },
                    data: { title: feed.title ?? src.title, lastChecked: new Date() },
                });
                await ctx.reply(`✅ ${feed.title || src.url} — OK`);
            }
            catch (err) {
                await ctx.reply(`❌ خطا در منبع ${src.url}: ${err.message}`);
            }
        }
        await ctx.reply("🔍 تست همه منابع به پایان رسید.");
        await ctx.scene.enter("SCRAPER_SCENE");
    });
    scraperScene.hears(["✅ فعال‌سازی", "🔴 غیرفعال‌سازی"], async (ctx) => {
        console.log('Toggle RSS heard');
        const sources = await prisma.rssSource.findMany({ orderBy: { id: "asc" } });
        if (sources.length === 0) {
            await ctx.reply("هیچ منبع RSS یافت نشد.", mainMenuKeyboard());
            return;
        }
        const enable = ctx.message.text === "✅ فعال‌سازی";
        await ctx.reply('منبع مورد نظر را انتخاب کنید', telegraf_1.Markup.inlineKeyboard([
            ...sources.map((s) => telegraf_1.Markup.button.callback(`${s.active ? "✅" : "🔴"} ${s.title}`, `TOGGLE_RSS_${enable ? "ENABLE" : "DISABLE"}_${s.id}`)),
            telegraf_1.Markup.button.callback("↩️ بازگشت به منو", "BACK_TO_MENU"),
        ]));
    });
    scraperScene.action(/TOGGLE_RSS_(ENABLE|DISABLE)_(\d+)/, async (ctx) => {
        const enable = ctx.match[1] === "ENABLE";
        const sourceId = parseInt(ctx.match[2], 10);
        const source = await prisma.rssSource.findUnique({ where: { id: sourceId } });
        if (!source) {
            await ctx.reply("منبع یافت نشد.", mainMenuKeyboard());
            return;
        }
        await prisma.rssSource.update({ where: { id: sourceId }, data: { active: enable } });
        await ctx.reply(`✅ منبع "${source.title}" اکنون ${enable ? "فعال" : "غیرفعال"} شد.`, mainMenuKeyboard());
    });
    stage.register(scraperScene);
    // Add Operator Wizard
    const addOperatorWizard = new telegraf_1.Scenes.WizardScene("ADD_OPERATOR_WIZARD", async (ctx) => {
        await ctx.reply("نام اپراتور را وارد کنید:", backToMenuKeyboard());
        return ctx.wizard.next();
    }, async (ctx) => {
        const text = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
        if (!text)
            return;
        const s = ctx.wizard.state;
        s.name = text;
        await ctx.reply("api_id را وارد کنید:");
        return ctx.wizard.next();
    }, async (ctx) => {
        const apiId = Number(ctx.message && "text" in ctx.message && ctx.message?.text?.trim());
        if (isNaN(apiId))
            return ctx.reply("api_id نامعتبر است.");
        const s = ctx.wizard.state;
        s.apiId = apiId;
        await ctx.reply("api_hash را وارد کنید:");
        return ctx.wizard.next();
    }, async (ctx) => {
        const text = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
        if (!text)
            return;
        const s = ctx.wizard.state;
        s.apiHash = text;
        await ctx.reply("شماره تلفن را با فرمت +989XXXXXXXXX ارسال کنید:");
        return ctx.wizard.next();
    }, 
    // Getting phone number and sending code
    async (ctx) => {
        const phone = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
        const s = ctx.wizard.state;
        s.phone = phone;
        s.session = new sessions_1.StringSession(""); // Empty session to start with
        s.client = new telegram_1.TelegramClient(s.session, Number(s.apiId), s.apiHash, { connectionRetries: 5 });
        await s.client.connect();
        console.log("Telegram client connected, sending code to", s.phone);
        try {
            const result = await s.client.sendCode({
                apiId: s.apiId,
                apiHash: s.apiHash
            }, s.phone);
            s.phoneCodeHash = result.phoneCodeHash;
            await ctx.reply("کد تأیید ارسال شد. لطفاً کد ۵ رقمی را وارد کنید:");
            return ctx.wizard.next();
        }
        catch (err) {
            console.error("Error sending code:", err);
            await ctx.reply("❌ ارسال کد لاگین با خطا مواجه شد. اطلاعات را بررسی کنید.");
            return ctx.scene.leave();
        }
    }, 
    // Getting login code and signing in
    async (ctx) => {
        const code = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
        const s = ctx.wizard.state;
        const getPass = async (ctx) => {
            const password = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
            return password;
        };
        try {
            await s.client.signInUser({
                apiId: s.apiId,
                apiHash: s.apiHash,
            }, {
                phoneNumber: async () => s.phone,
                phoneCode: async () => code,
                // password: async () => {
                //   // If 2FA password needed
                //   await ctx.reply("🔐 حساب دارای رمز دو مرحله‌ای است. لطفاً رمز را وارد کنید:");
                //   return new Promise<string>((resolve) => {
                //     ctx.wizard.next();
                //     (ctx.wizard.state as any).resolvePassword = resolve;
                //   });
                // },
                onError: (err) => console.log("Login error:", err),
            });
            // Save session
            const sessionString = s.client.session.save();
            s.session = sessionString;
            await prisma.operator.create({
                data: {
                    name: s.name,
                    apiId: s.apiId,
                    apiHash: s.apiHash,
                    phone: s.phone,
                    session: sessionString,
                    enabled: true,
                },
            });
            await ctx.reply("✅ اپراتور با موفقیت افزوده شد و سشن ذخیره گردید.", mainMenuKeyboard());
            await s.client.disconnect();
            return ctx.scene.leave();
        }
        catch (err) {
            if (err.message === "Account has 2FA enabled.") {
                await ctx.reply("🔐 حساب شما رمز دومرحله‌ای دارد. لطفاً رمز عبور را وارد کنید:");
                ctx.wizard.state.needPassword = true;
                ctx.wizard.state.code = code;
                return ctx.wizard.next();
            }
            else {
                await ctx.reply("❌ ورود ناموفق: " + err.message);
                return ctx.scene.leave();
            }
        }
    }, 
    // Getting 2FA password if needed
    async (ctx) => {
        const password = ctx.message && "text" in ctx.message && ctx.message?.text?.trim();
        const s = ctx.wizard.state;
        if (!s.needPassword) {
            await ctx.reply("خطای منطقی: نیازی به رمز نبود.");
            return ctx.scene.leave();
        }
        console.log("Received 2FA password, attempting sign-in...", password);
        try {
            await s.client.signInWithPassword({ apiId: s.apiId, apiHash: s.apiHash }, {
                // phoneNumber: async () => s.phone,
                // phoneCode: async () => s.code!,
                password: async () => password,
                onError: (err) => console.log("Login error:", err)
            });
            const sessionString = s.client.session.save();
            s.session = sessionString;
            console.log("2FA sign-in successful, session : ", sessionString);
            await prisma.operator.create({
                data: {
                    name: s.name,
                    apiId: s.apiId,
                    apiHash: s.apiHash,
                    phone: s.phone,
                    session: sessionString,
                    enabled: true,
                },
            });
            await ctx.reply("✅ ورود موفق و ذخیره‌سازی Session انجام شد.", mainMenuKeyboard());
        }
        catch (err) {
            await ctx.reply("❌ رمز عبور اشتباه است یا ورود انجام نشد.");
        }
        finally {
            await s.client.disconnect();
            return ctx.scene.leave();
        }
    });
    // Manage Operator Scene: choose operator -> action (enable/disable/delete) -> confirm
    const manageOperatorScene = new telegraf_1.Scenes.BaseScene("MANAGE_OPERATOR_SCENE");
    manageOperatorScene.enter(async (ctx) => {
        const ops = await prisma.operator.findMany({ orderBy: { id: "asc" } });
        if (ops.length === 0) {
            await ctx.reply("هیچ اپراتوری یافت نشد.", mainMenuKeyboard());
            await ctx.scene.leave();
            return;
        }
        const list = ops.map((o) => `${o.enabled ? "🟢" : "🔴"} ${o.name}`).join("\n");
        const buttons = ops.map((s) => telegraf_1.Markup.button.text(`${s.name}`));
        const keyboard = [];
        for (let i = 0; i < buttons.length; i += 3) {
            keyboard.push(buttons.slice(i, i + 3));
        }
        await ctx.reply(`فهرست اپراتورها:\n\n${list}\n\nنام اپراتور را انتخاب کنید تا عملیات را انتخاب کنیم:`, telegraf_1.Markup.keyboard(keyboard).resize());
    });
    manageOperatorScene.hears("🟢 فعال‌سازی", async (ctx) => {
        const data = ctx.session.wizardData;
        if (!data?.operatorId) {
            await ctx.reply("ابتدا اپراتور را انتخاب کنید.");
            return;
        }
        await prisma.operator.update({ where: { id: data.operatorId }, data: { enabled: true } });
        await ctx.reply(`✅ اپراتور ${data.operatorName} فعال شد.`, mainMenuKeyboard());
        await ctx.scene.leave();
    });
    manageOperatorScene.hears("🔴 غیرفعال‌سازی", async (ctx) => {
        console.log('Op name : ', ctx.session.wizardData);
        const data = ctx.session.wizardData;
        if (!data?.operatorId) {
            await ctx.reply("ابتدا اپراتور را انتخاب کنید.");
            return;
        }
        await prisma.operator.update({ where: { id: data.operatorId }, data: { enabled: false } });
        await ctx.reply(`✅ اپراتور ${data.operatorName} غیرفعال شد.`, mainMenuKeyboard());
        await ctx.scene.leave();
    });
    manageOperatorScene.hears("🗑 حذف اپراتور", async (ctx) => {
        const data = ctx.session.wizardData;
        if (!data?.operatorId) {
            await ctx.reply("ابتدا اپراتور را انتخاب کنید.");
            return;
        }
        await prisma.operator.delete({ where: { id: data.operatorId } });
        await ctx.reply(`🗑 اپراتور ${data.operatorName} حذف شد.`, mainMenuKeyboard());
        await ctx.scene.leave();
    });
    manageOperatorScene.hears("↩️ بازگشت به منو", async (ctx) => {
        await ctx.reply("بازگشت به منوی اصلی.", mainMenuKeyboard());
        await ctx.scene.leave();
    });
    manageOperatorScene.on("text", async (ctx) => {
        const name = ctx.message.text.trim();
        if (name === "↩️ بازگشت به منو") {
            await ctx.reply("بازگشت به منوی اصلی.", mainMenuKeyboard());
            await ctx.scene.leave();
            return;
        }
        const op = await prisma.operator.findUnique({ where: { name } });
        if (!op) {
            await ctx.reply("اپراتوری با این نام یافت نشد. لطفاً نام معتبر ارسال کنید یا ↩️ برای بازگشت.");
            return;
        }
        ctx.session.wizardData = { operatorName: op.name, operatorId: op.id };
        await ctx.reply(`اپراتور انتخاب شد: ${op.name}\nانتخاب کنید:`, telegraf_1.Markup.keyboard([["🟢 فعال‌سازی", "🔴 غیرفعال‌سازی"], ["🗑 حذف اپراتور"], ["↩️ بازگشت به منو"]]).resize());
    });
    // Register scenes to stage
    stage.register(addOperatorWizard);
    stage.register(manageOperatorScene);
    // ---------- Menu handlers ----------
    bot.hears("👥 اپراتورها", async (ctx) => {
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            await ctx.reply("⛔️ دسترسی شما مجاز نیست.");
            return;
        }
        await ctx.reply("مدیریت اپراتورها:\nیکی از گزینه‌ها را انتخاب کنید:", telegraf_1.Markup.keyboard([["👥 مدیریت اپراتورها", "➕ افزودن اپراتور جدید"], ["↩️ بازگشت به منو"]]).resize());
    });
    bot.hears("👥 مدیریت اپراتورها", async (ctx) => {
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            await ctx.reply("⛔️ دسترسی شما مجاز نیست.");
            return;
        }
        await ctx.scene.enter("MANAGE_OPERATOR_SCENE");
    });
    bot.hears("➕ افزودن اپراتور جدید", async (ctx) => {
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            await ctx.reply("⛔️ دسترسی شما مجاز نیست.");
            return;
        }
        await ctx.scene.enter("ADD_OPERATOR_WIZARD");
    });
    bot.hears("📤 دعوت اعضا", async (ctx) => {
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            await ctx.reply("⛔️ دسترسی شما مجاز نیست.");
            return;
        }
        const user = await prisma.user.upsert({
            where: { telegramId: BigInt(ctx.from.id) },
            create: { telegramId: BigInt(ctx.from.id), username: ctx.from.username ?? undefined },
            update: {},
        });
        const val = await settingService.getSettingValue("invite_enabled");
        const isActive = val === "true";
        await ctx.reply(`وضعیت فعلی ارسال دعوت‌ها: ${isActive ? "✅ فعال" : "🔴 غیرفعال"}\nمی‌خواهید وضعیت را تغییر دهید؟`, telegraf_1.Markup.keyboard([["🟢 فعال کن", "🔴 غیرفعال کن"], ["↩️ بازگشت به منو"]]).resize());
    });
    bot.hears(["🟢 فعال کن", "🔴 غیرفعال کن"], async (ctx) => {
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            await ctx.reply("⛔️ دسترسی شما مجاز نیست.");
            return;
        }
        const enable = ctx.message.text === "🟢 فعال کن";
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
        await settingService.setSetting("invite_enabled", enable ? "true" : "false", user?.id);
        await ctx.reply(`✅ وضعیت جدید ذخیره شد: ${enable ? "فعال" : "غیرفعال"}`, mainMenuKeyboard());
    });
    bot.hears("📥 اسکرپر", async (ctx) => {
        ctx.scene.enter("SCRAPER_SCENE");
    });
    bot.hears("📰 ارسال خبر", async (ctx) => {
        await ctx.reply("🚧 این بخش در حال توسعه است.", mainMenuKeyboard());
    });
    bot.hears("📦 مدیریت سفارشات", async (ctx) => {
        await ctx.scene.enter("ADMIN_REVIEW_ORDERS_SCENE");
    });
    bot.hears("⏰ زمان‌بندی", async (ctx) => {
        await ctx.reply("🚧 این بخش در حال توسعه است.", mainMenuKeyboard());
    });
    bot.hears("⚙️ تنظیمات عمومی", async (ctx) => {
        ctx.scene.enter("BOT_SETTINGS_SCENE");
    });
    bot.hears("↩️ بازگشت به منو", async (ctx) => {
        ctx.session = {};
        await ctx.reply("بازگشت به منوی اصلی.", mainMenuKeyboard());
    });
    // fallback for other text when not in a scene
    bot.on("text", async (ctx, next) => {
        if (ctx.chat?.type !== "private")
            return next();
        console.log("Fallback text handler triggered");
        // if inside a scene, let scene handlers process
        if (ctx.scene && ctx.scene.current) {
            return next();
        }
        // otherwise, if message doesn't match any menu, re-show main menu for admin
        const fromId = ctx.from?.id?.toString() ?? "";
        const curUser = await userRepo.findByTelegramId(ctx.from?.id);
        if (fromId !== ADMIN_ID && (!curUser || !curUser.isAdmin)) {
            return;
        }
        await ctx.reply("لطفاً یکی از گزینه‌های منو را انتخاب کنید.", mainMenuKeyboard());
    });
}
// launch
// bot.launch().then(() => console.log("Admin bot launched"));
