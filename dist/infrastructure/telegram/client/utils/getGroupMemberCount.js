"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupMemberCount = getGroupMemberCount;
const tl_1 = require("telegram/tl");
/**
 * Try to get total member count from various TL calls.
 */
async function getGroupMemberCount(client, entity) {
    try {
        // Try channel full info first (works for channels & supergroups)
        const res = await client.invoke(new tl_1.Api.channels.GetFullChannel({ channel: entity }));
        const total = 
        // different TL shapes: try several fields
        (res?.full_chat && (res.full_chat.participants_count ?? res.full_chat.participantsCount)) ||
            (res?.fullChat && (res.fullChat.participantsCount ?? res.fullChat.participants_count)) ||
            0;
        if (total && total > 0)
            return Number(total);
    }
    catch (err) {
        // ignore and try next
        // console.warn("GetFullChannel failed:", err?.message ?? err);
    }
    try {
        // Try legacy groups: messages.GetFullChat
        const res2 = await client.invoke(new tl_1.Api.messages.GetFullChat({ chatId: entity }));
        const total2 = (res2?.full_chat && (res2.full_chat.participants_count ?? res2.full_chat.participantsCount)) ||
            (res2?.fullChat && (res2.fullChat.participantsCount ?? res2.fullChat.participants_count)) ||
            0;
        if (total2 && total2 > 0)
            return Number(total2);
    }
    catch (err) {
        // ignore
        // console.warn("GetFullChat failed:", err?.message ?? err);
    }
    // not available
    return 0;
}
