import { TelegramClient } from "telegram";
import {Api} from "telegram/tl"
import { sleep } from "../../../helpers/sleep";
import { extractSenderInfo } from "./extractSenderInfo";

/**
 * Scrape users from message history. Returns deduplicated array of user objects.
 * This is the fallback when GetParticipants returns too few users.
 */
export async function fetchUsersFromMessages(client: TelegramClient, entity: any, maxMessagesToScan = 5000, perBatch = 200): Promise<any[]> {
    const usersMap = new Map<string, any>();
    let offsetId = 0;
    let scanned = 0;
  
    while (scanned < maxMessagesToScan) {
      let msgs: any[] = [];
      try {
        if (offsetId === 0) {
          msgs = await (client as any).getMessages(entity, { limit: perBatch });
        } else {
          msgs = await (client as any).getMessages(entity, { limit: perBatch, offsetId });
        }
      } catch (err) {
        console.warn("Error fetching messages batch:", err);
        await sleep(1500);
        continue;
      }
  
      if (!msgs || msgs.length === 0) break;
  
      for (const m of msgs) {
        if (scanned >= maxMessagesToScan) break;
        scanned++;
        const s = extractSenderInfo(m);
        if (!s || !s.id) continue;
        const key = String(s.id);
        if (!usersMap.has(key)) {
          usersMap.set(key, {
            id: s.id,
            username: s.username ?? null,
            firstName: s.firstName ?? null,
            lastName: s.lastName ?? null,
          });
        }
      }
  
      const oldest = msgs[msgs.length - 1];
      const oldestId = oldest?.id ?? oldest?.messageId ?? 0;
      if (!oldestId) break;
      offsetId = oldestId;
      await sleep(900); // small delay between batches to be safe
    }
  
    return Array.from(usersMap.values());
  }
  