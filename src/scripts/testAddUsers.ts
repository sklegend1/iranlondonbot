import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { addUsersFromDB } from "../infrastructure/telegram/client/AddUsersFromDB";
const input = require("input");
import "dotenv/config";

(async () => {
  try {
    const apiId = Number(process.env.TELEGRAM_API_ID3);
    const apiHash = process.env.TELEGRAM_API_HASH3!;
    const sessionString = process.env.TELEGRAM_STRING_SESSION3!; // from a real logged-in user (StringSession)
    const sourceGroup = "ir98uk44"
    // await input.text("Enter OLD group username or invite link (without @ for username): "); // username or id
    const targetGroup = "iranian_london23"
    //await input.text("Enter NEW group username or invite link (without @ for username): "); // username or id

    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
      connectionRetries: 999,
        timeout: 30
    });

    console.log("Connecting client...");
    await client.connect();

    if (!client.connected) {
      console.log("Client not connected, trying start()...");
      await client.start({
        phoneNumber: async () => Promise.resolve(process.env.TG_PHONE!),
        password: async () => Promise.resolve(process.env.TG_PASS || ""),
        phoneCode: async () => {
          throw new Error("Code login required — use an already logged-in session");
        },
        onError: (err) => console.error("Auth error", err),
      });
    }

    console.log("Client connected ✅");

    await addUsersFromDB(client, sourceGroup, targetGroup);

    console.log("All done ✅");
    process.exit(0);
  } catch (err) {
    console.error("Test script error:", err);
    process.exit(1);
  }
})();
