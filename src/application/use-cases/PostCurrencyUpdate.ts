import { CurrencyService } from "../../infrastructure/external/CurrencyService";
import { TelegramService } from "../../infrastructure/telegram/TelegramService";

export class PostCurrencyUpdate {
  constructor(
    private currencyService: CurrencyService,
    private telegramService: TelegramService
  ) {}

  async execute(): Promise<void> {
    const data = await this.currencyService.fetchData();

    const goldList = data.gold.slice(0, 3).map(
      (g) => `• ${g.name}: ${g.price.toLocaleString()} ${g.unit} (${g.change_percent > 0 ? "📈" : "📉"} ${g.change_percent}%)`
    );

    const fxList = data.currency
      .filter((c) => ["USD", "EUR", "GBP", "AED"].includes(c.symbol))
      .map(
        (c) => `• ${c.name}: ${c.price.toLocaleString()} ${c.unit} (${c.change_percent > 0 ? "📈" : "📉"} ${c.change_percent}%)`
      );

    const cryptoList = data.cryptocurrency
      .filter((c) => ["BTC", "ETH", "BNB"].includes(c.symbol))
      .map(
        (c) => `• ${c.name}: ${c.price} ${c.unit} (${c.change_percent > 0 ? "📈" : "📉"} ${c.change_percent}%)`
      );

    const message =
`💰 **به‌روزرسانی بازار امروز**
📅 ${data.gold[0].date} ⏰ ${data.gold[0].time.toLocaleString("fa-IR")}

🏆 **طلا و سکه:**
${goldList.join("\n")}

💵 **ارزهای رایج:**
${fxList.join("\n")}

💎 **رمزارزها:**
${cryptoList.join("\n")}

📊 منبع: TSETMC`;

    await this.telegramService.sendText(message);
  }
}
