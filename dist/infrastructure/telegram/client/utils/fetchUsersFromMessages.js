"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUsersFromMessages = fetchUsersFromMessages;
const sleep_1 = require("../../../helpers/sleep");
const extractSenderInfo_1 = require("./extractSenderInfo");
/**
 * Scrape users from message history. Returns deduplicated array of user objects.
 * This is the fallback when GetParticipants returns too few users.
 */
async function fetchUsersFromMessages(client, entity, maxMessagesToScan = 5000, perBatch = 200) {
    const usersMap = new Map();
    let offsetId = 0;
    let scanned = 0;
    while (scanned < maxMessagesToScan) {
        let msgs = [];
        try {
            if (offsetId === 0) {
                msgs = await client.getMessages(entity, { limit: perBatch });
            }
            else {
                msgs = await client.getMessages(entity, { limit: perBatch, offsetId });
            }
        }
        catch (err) {
            console.warn("Error fetching messages batch:", err);
            await (0, sleep_1.sleep)(1500);
            continue;
        }
        if (!msgs || msgs.length === 0)
            break;
        for (const m of msgs) {
            if (scanned >= maxMessagesToScan)
                break;
            scanned++;
            const s = (0, extractSenderInfo_1.extractSenderInfo)(m);
            if (!s || !s.id)
                continue;
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
        if (!oldestId)
            break;
        offsetId = oldestId;
        await (0, sleep_1.sleep)(900); // small delay between batches to be safe
    }
    return Array.from(usersMap.values());
}
