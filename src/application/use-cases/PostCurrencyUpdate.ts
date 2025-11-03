import { CurrencyService } from "../../infrastructure/external/CurrencyService";
import { TelegramService } from "../../infrastructure/telegram/TelegramService";

export class PostCurrencyUpdate {
  constructor(
    private currencyService: CurrencyService,
    private telegramService: TelegramService
  ) {}

  async execute(): Promise<void> {
    const data = await this.currencyService.fetchData();

    // تاریخ و زمان
    const date = data.gold[0].date;
    const time = data.gold[0].time.toLocaleString("fa-IR");

    // طلا و سکه
    const goldList = data.gold.slice(0, 3).map(
      (g) => `   ✨ ${g.name}   💰 ${g.price.toLocaleString()} ${g.unit}   ${g.change_percent > 0 ? "📈" : "📉"} ${g.change_percent}%`
    );

    // ارزها - پوند اول و بولد!
    const fxOrder = ["GBP", "USD", "EUR", "AED"];
    const fxList = fxOrder
      .map(symbol => data.currency.find(c => c.symbol === symbol))
      .filter(Boolean)
      .map((c, i) => {
        const isPound = c!.symbol === "GBP";
        const name = `*${c!.name}*` 
        const price = `*${c!.price.toLocaleString()}*` ;
        const change = c!.change_percent > 0 ? "📈" : "📉";
        const percent = `${change} ${c!.change_percent}%`;
        const medal = i === 0 ? "🥇" : "   ";
        return `${medal} ${name}   💸 ${price} ${c!.unit}  ${percent}`;
      });

    // رمزارزها
    const cryptoList = data.cryptocurrency
      .filter((c) => ["BTC", "ETH", "BNB"].includes(c.symbol))
      .map(
        (c) => `   ${c.name}   🪙 ${c.price.toLocaleString()} ${c.unit}   ${c.change_percent > 0 ? "📈" : "📉"} ${c.change_percent}%`
      );

    // پیام نهایی با طراحی حرفه‌ای
    const message = `
*💰 به‌روزرسانی لحظه‌ای بازار - ${date}*
⏰ ساعت: ${time}

*— ارزهای مهم —*
 
${fxList.join("\n\n")}

*— طلا و سکه —*

${goldList.join("\n\n")}

*— رمزارزهای برتر —*
${cryptoList.join("\n\n")}

📊 منبع: TSETMC | بروزرسانی خودکار
    `.trim();

    await this.telegramService.sendText(message);
  }
}