import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { syncTargetGroupMembers } from "../infrastructure/telegram/client/syncTargetGroupMembers";

(async () => {
  const apiId = Number(process.env.TELEGRAM_API_ID0);
const apiHash = process.env.TELEGRAM_API_HASH0;
  const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION0!);

  const client = new TelegramClient(stringSession, apiId, apiHash!, {
    connectionRetries: 5,
  });

  console.log("Connecting to Telegram...");
  await client.connect();

  
  const targetGroupKey = "iranian_london23"; // unique key for your reference
  const targetGroupUsername = "@iranian_london23"; // unique key for your reference";

  console.log(`Syncing members for ${targetGroupUsername}...`);
  await syncTargetGroupMembers(client, targetGroupKey, targetGroupUsername);

  console.log("✅ Done syncing members!");
  process.exit(0);
})();
