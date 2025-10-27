import { TelegramClient } from "telegram";
import {Api} from "telegram/tl"
import { toBigIntOrLong } from "../../../helpers/ToBigIntOrLong";

/**
 * High-level participant fetch (try client.getParticipants if available),
 * falls back to low-level channels.GetParticipants pages.
 */
export async function fetchAllParticipantsHighLevel(client: TelegramClient, entity: any, pageLimit = 200): Promise<any[]> {
    const results: any[] = [];
  
    // try client.getParticipants (some gramjs versions expose it)
    try {
      if (typeof (client as any).getParticipants === "function") {
        let offset = 0;
        while (true) {
          const page: any[] = await (client as any).getParticipants(entity, { limit: pageLimit, offset });
          if (!page || page.length === 0) break;
          results.push(...page);
          if (page.length < pageLimit) break;
          offset += page.length;
        }
        return results;
      }
    } catch (err) {
      // fallback to low-level
      // console.warn("High-level getParticipants failed, fallback to low-level", err?.message ?? err);
    }
  
    // low-level fallback: use channels.GetParticipants
    try {
      let offset = 0;
      while (true) {
        const res: any = await client.invoke(
          new Api.channels.GetParticipants({
            channel: entity,
            filter: new Api.ChannelParticipantsRecent(),
            offset,
            limit: pageLimit,
            hash: toBigIntOrLong(0),
          })
        );
        const fetched = res.participants || [];
        // map to user objects
        const users = (fetched as any[]).map((p: any) => (res.users || []).find((u: any) => Number(u.id) === Number(p.userId))).filter(Boolean);
        if (!users.length) break;
        results.push(...users);
        if (fetched.length < pageLimit) break;
        offset += fetched.length;
      }
    } catch (err) {
      // console.error("Low-level GetParticipants failed:", err?.message ?? err);
    }
  
    return results;
  }
   