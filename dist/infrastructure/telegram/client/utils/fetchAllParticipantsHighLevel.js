"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllParticipantsHighLevel = fetchAllParticipantsHighLevel;
const tl_1 = require("telegram/tl");
const ToBigIntOrLong_1 = require("../../../helpers/ToBigIntOrLong");
/**
 * High-level participant fetch (try client.getParticipants if available),
 * falls back to low-level channels.GetParticipants pages.
 */
async function fetchAllParticipantsHighLevel(client, entity, pageLimit = 200) {
    const results = [];
    // try client.getParticipants (some gramjs versions expose it)
    try {
        if (typeof client.getParticipants === "function") {
            let offset = 0;
            while (true) {
                const page = await client.getParticipants(entity, { limit: pageLimit, offset });
                if (!page || page.length === 0)
                    break;
                results.push(...page);
                if (page.length < pageLimit)
                    break;
                offset += page.length;
            }
            return results;
        }
    }
    catch (err) {
        // fallback to low-level
        // console.warn("High-level getParticipants failed, fallback to low-level", err?.message ?? err);
    }
    // low-level fallback: use channels.GetParticipants
    try {
        let offset = 0;
        while (true) {
            const res = await client.invoke(new tl_1.Api.channels.GetParticipants({
                channel: entity,
                filter: new tl_1.Api.ChannelParticipantsRecent(),
                offset,
                limit: pageLimit,
                hash: (0, ToBigIntOrLong_1.toBigIntOrLong)(0),
            }));
            const fetched = res.participants || [];
            // map to user objects
            const users = fetched.map((p) => (res.users || []).find((u) => Number(u.id) === Number(p.userId))).filter(Boolean);
            if (!users.length)
                break;
            results.push(...users);
            if (fetched.length < pageLimit)
                break;
            offset += fetched.length;
        }
    }
    catch (err) {
        // console.error("Low-level GetParticipants failed:", err?.message ?? err);
    }
    return results;
}
