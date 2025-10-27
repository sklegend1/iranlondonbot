"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMembersWithFallback = fetchMembersWithFallback;
const fetchAllParticipantsHighLevel_1 = require("./fetchAllParticipantsHighLevel");
const fetchUsersFromMessages_1 = require("./fetchUsersFromMessages");
const getGroupMemberCount_1 = require("./getGroupMemberCount");
function convertToMember(members) {
    const convScraped = members.reduce(function (result, member) {
        //const userId = member.id?member.id:undefined;
        if (!member.bot && !member.deleted) {
            result.push({ userId: member.id,
                username: member.username,
                firstName: member.firstName,
                lastName: member.lastName,
                accessHash: member.accessHash });
        }
        return result;
    }, []);
    return convScraped;
}
/**
 * Try to fetch members via participants. If participants count is clearly incomplete
 * (less than threshold fraction of total), fallback to message-scraping.
 *
 * thresholdFraction default 0.5 => if fetched < 50% of reported total => fallback.
 */
async function fetchMembersWithFallback(client, entity, opts) {
    const maxMessagesToScan = opts?.maxMessagesToScan ?? 5000;
    const pageLimit = opts?.participantsPageLimit ?? 200;
    const thresholdFraction = opts?.thresholdFraction ?? 0.5;
    // 1) try to get total count
    const totalCount = await (0, getGroupMemberCount_1.getGroupMemberCount)(client, entity);
    console.log(`[fetchMembersWithFallback] reported totalCount = ${totalCount}`);
    // 2) try participants fetch
    const participants = await (0, fetchAllParticipantsHighLevel_1.fetchAllParticipantsHighLevel)(client, entity, pageLimit);
    console.log(`[fetchMembersWithFallback] participants fetched = ${participants.length}`);
    // 3) Decide whether to fallback
    if (totalCount > 0 && participants.length < Math.ceil(totalCount * thresholdFraction)) {
        console.log("[fetchMembersWithFallback] participants seem incomplete -> falling back to message scraping");
        const scraped = await (0, fetchUsersFromMessages_1.fetchUsersFromMessages)(client, entity, maxMessagesToScan, pageLimit);
        console.log(`[fetchMembersWithFallback] scraped users = ${scraped.length}`);
        return convertToMember(scraped);
    }
    // 4) If participants are non-empty use them; otherwise if nothing found, fallback too
    if (participants.length > 0)
        return convertToMember(participants);
    console.log("[fetchMembersWithFallback] participants empty, using message scraping fallback");
    const scraped = await (0, fetchUsersFromMessages_1.fetchUsersFromMessages)(client, entity, maxMessagesToScan, pageLimit);
    return convertToMember(scraped);
}
