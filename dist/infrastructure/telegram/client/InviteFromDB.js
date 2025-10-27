"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteFromDB = inviteFromDB;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const telegram_2 = require("telegram");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const big_integer_1 = __importDefault(require("big-integer"));
dotenv_1.default.config();
const TARGET_GROUP_KEY = process.env.TARGET_GROUP_KEY || "iranian_london23";
const MAX_INVITES_PER_OPERATOR = 20; // per 24 hours
const MIN_DELAY_MINUTES = 3;
const MAX_DELAY_MINUTES = 7;
const prisma = new client_1.PrismaClient();
function randomDelay(min, max) {
    const minutes = Math.floor(Math.random() * (max - min + 1)) + min;
    return minutes * 60 * 1000;
}
// --- helper: get candidate user DB rows that have an accessHash for this operator
async function getCandidatesWithAccessHash(operatorId, limit = 200) {
    // fetch accessHash rows for this operator and join with scrapedUser
    const rows = await prisma.accessHash.findMany({
        where: { operatorId },
        take: limit,
        include: { user: true }, // user is ScrapedUser
    });
    // rows[i].user is the ScrapedUser
    return rows.map(r => ({ accessHashRow: r, user: r.user }));
}
// Check if operator exceeded 20 invites in the past 24h
async function operatorCanInvite(operatorId) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.inviteLog.count({
        where: {
            operatorId,
            createdAt: { gte: since },
            status: "success",
        },
    });
    return count < MAX_INVITES_PER_OPERATOR;
}
async function getTargetGroup(tgKey) {
    const group = await prisma.targetGroup.findUnique({
        where: { key: tgKey },
    });
    if (!group)
        throw new Error(`Target group with key ${tgKey} not found`);
    return group;
}
async function inviteFromDB(target) {
    const group = await getTargetGroup(target);
    const operators = await prisma.operator.findMany({ where: { enabled: true } });
    console.log(`Found ${operators.length} active operators.`);
    for (const op of operators) {
        const canInvite = await operatorCanInvite(op.id);
        if (!canInvite) {
            console.log(`Operator ${op.name} reached daily limit, skipping.`);
            continue;
        }
        // Find next user not yet invited by this operator or already added
        const candidateRows = await getCandidatesWithAccessHash(op.id, 200);
        let nextUser = null;
        for (const { accessHashRow, user } of candidateRows) {
            // 1) check added JSON for this target group key
            const added = (user.added || {});
            if (added[group.key] && added[group.key].status === "success") {
                // already marked as success for this group
                continue;
            }
            // 2) check if user is already member in TargetGroupMember table
            const tgMember = await prisma.targetGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId: group.id,
                        userId: BigInt(String(user.userId)),
                    }
                }
            });
            if (tgMember) {
                // user already in target group
                // optionally update scrapedUser.added to success too
                continue;
            }
            // 3) check invite logs for success by this operator & group
            const prevInvite = await prisma.inviteLog.findFirst({
                where: { operatorId: op.id, userId: user.userId, groupKey: group.key }
            });
            if (prevInvite)
                continue;
            // if all checks passed, select this user
            nextUser = { user, accessHashRow };
            break;
        }
        if (!nextUser) {
            console.log(`No uninvited users found for operator ${op.name}. Skipping.`);
            continue;
        }
        const access = nextUser.accessHashRow.accessHash;
        if (!access) {
            console.log(`No access hash for user ${nextUser.user.userId} and operator ${op.name}. Skipping.`);
            continue;
        }
        const client = new telegram_1.TelegramClient(new sessions_1.StringSession(op.session), op.apiId, op.apiHash, { connectionRetries: 3 });
        try {
            await client.connect();
            const inputUser = new telegram_2.Api.InputPeerUser({
                userId: (0, big_integer_1.default)(nextUser.user.userId),
                accessHash: (0, big_integer_1.default)(access),
            });
            const target = group.username?.startsWith("@")
                ? group.username
                : group.username?.replace("https://t.me/", "") ?? "";
            const channel = await client.getEntity(target);
            console.log(`Inviting ${nextUser.user.username || nextUser.user.userId} using ${op.name}...`);
            await client.invoke(new telegram_2.Api.channels.InviteToChannel({
                channel,
                users: [inputUser],
            }));
            await prisma.inviteLog.create({
                data: {
                    operatorId: op.id,
                    userId: nextUser.user.userId,
                    groupKey: group.key,
                    status: "success",
                    method: "input_user",
                },
            });
            await prisma.scrapedUser.update({
                where: { userId: nextUser.user.userId },
                data: {
                    added: {
                        ...nextUser.user.added,
                        [group.key]: "success",
                    },
                },
            });
            console.log(`✅ Successfully invited ${nextUser.user.username || nextUser.user.userId}`);
            // Wait random delay before next attempt
            const delay = randomDelay(MIN_DELAY_MINUTES, MAX_DELAY_MINUTES);
            console.log(`Waiting ${Math.round(delay / 60000)} minutes before next invite...`);
            await new Promise((r) => setTimeout(r, delay));
        }
        catch (error) {
            console.error(`❌ Error inviting user ${nextUser.user.userId} by ${op.name}: ${error.message}`);
            await prisma.inviteLog.create({
                data: {
                    operatorId: op.id,
                    userId: nextUser.user.userId,
                    groupKey: group.key,
                    status: "failed",
                    reason: error.message,
                },
            });
            if (error.message.includes("FLOOD_WAIT") || error.message.includes("PEER_FLOOD")) {
                console.warn(`⚠️ Operator ${op.name} hit rate limit. Skipping temporarily.`);
                continue; // move to next operator
            }
        }
        finally {
            await client.disconnect();
        }
    }
    console.log("🚀 All operators processed.");
}
// main()
//   .then(() => console.log("Done."))
//   .catch((err) => console.error("Fatal error:", err));
