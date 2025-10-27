"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTargetGroupMembers = syncTargetGroupMembers;
const tl_1 = require("telegram/tl");
const big_integer_1 = __importDefault(require("big-integer"));
const PrismaTargetGroupRepository_1 = require("../../db/repositories/PrismaTargetGroupRepository");
const PrismaTargetGroupMemberRepository_1 = require("../../db/repositories/PrismaTargetGroupMemberRepository");
const groupRepo = new PrismaTargetGroupRepository_1.PrismaTargetGroupRepository();
const memberRepo = new PrismaTargetGroupMemberRepository_1.PrismaTargetGroupMemberRepository();
// Filters to cover all member types
const filters = [
    { filter: new tl_1.Api.ChannelParticipantsRecent(), status: "active" },
    { filter: new tl_1.Api.ChannelParticipantsAdmins(), status: "admin" },
    { filter: new tl_1.Api.ChannelParticipantsBots(), status: "bot" },
    { filter: new tl_1.Api.ChannelParticipantsKicked({ q: "" }), status: "kicked" },
    { filter: new tl_1.Api.ChannelParticipantsBanned({ q: "" }), status: "banned" },
];
async function syncTargetGroupMembers(client, groupKey, groupIdentifier) {
    const entity = await client.getEntity(groupIdentifier);
    const group = await groupRepo.upsertGroup({
        key: groupKey,
        username: groupIdentifier,
        title: entity.title,
    });
    for (const { filter, status } of filters) {
        let offset = 0;
        const limit = 200;
        console.log(`Fetching ${status} members...`);
        while (true) {
            const res = await client.invoke(new tl_1.Api.channels.GetParticipants({
                channel: entity,
                filter,
                offset,
                limit,
                hash: (0, big_integer_1.default)(0),
            }));
            const participants = res.participants;
            const usersMap = new Map(res.users.map((u) => [u.id.toString(), u]));
            if (!participants.length)
                break;
            //console.log(participants[2]);
            for (const p of participants) {
                let u;
                if (status === 'kicked' || status === 'banned') {
                    u = usersMap.get(p.userId?.toString()) || usersMap.get(p.peer.userId?.toString());
                }
                else {
                    u = usersMap.get(p.userId?.toString());
                }
                if (!u)
                    continue;
                //console.log(u)
                await memberRepo.addOrUpdateMember(group.id, {
                    userId: BigInt(u.id.toString()),
                    username: u.username,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    status,
                });
            }
            offset += participants.length;
            console.log(`Fetched ${offset} ${status} so far...`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    console.log(`✅ Synced all members for ${groupKey}`);
}
