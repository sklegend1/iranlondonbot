"use strict";
// src/infrastructure/telegram/AddUsersFromOldGroup.ts
/**
 * Add users to target groups using multiple operators in round-robin.
 * - Operators are loaded from DB (each contains session string).
 * - For each scraped user, pick next operator and attempt invite using that operator's client.
 * - Per-operator accessHash is used; resolve+persist if missing or invalid.
 *
 * All comments are English.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUsersFromDbToGroup = addUsersFromDbToGroup;
require("dotenv/config");
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const tl_1 = require("telegram/tl");
const PrismaOperatorRepository_1 = require("../../db/repositories/PrismaOperatorRepository");
const PrismaScrapedUserRepository_1 = require("../../db/repositories/PrismaScrapedUserRepository");
const PrismaAccessHashRepository_1 = require("../../db/repositories/PrismaAccessHashRepository");
const PrismaInviteLogRepository_1 = require("../../db/repositories/PrismaInviteLogRepository");
const big_integer_1 = __importDefault(require("big-integer"));
const PrismaTargetGroupMemberRepository_1 = require("../../db/repositories/PrismaTargetGroupMemberRepository");
const opRepo = new PrismaOperatorRepository_1.PrismaOperatorRepository();
const userRepo = new PrismaScrapedUserRepository_1.PrismaScrapedUserRepository();
const ahRepo = new PrismaAccessHashRepository_1.PrismaAccessHashRepository();
const logRepo = new PrismaInviteLogRepository_1.PrismaInviteLogRepository();
const targetMemberRepo = new PrismaTargetGroupMemberRepository_1.PrismaTargetGroupMemberRepository();
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function toBigIntSafe(v) {
    if (v === null || v === undefined)
        return null;
    if (typeof v === "bigint")
        return v;
    try {
        return BigInt(String(v));
    }
    catch {
        return null;
    }
}
async function createClientForOperator(sessionString, apiId, apiHash) {
    const client = new telegram_1.TelegramClient(new sessions_1.StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    return client;
}
/**
 * Resolve entity and return normalized accessHash string & userId string
 */
async function resolveEntityAndSave(client, userIdentifier) {
    try {
        const ent = await client.getEntity(userIdentifier);
        const accessHash = ent.accessHash ?? ent.access_hash ?? ent.accessHashBigInt ?? null;
        const id = ent.id ?? ent.userId ?? null;
        return { accessHash: accessHash ? String(accessHash) : null, userId: id ? String(id) : null, username: ent.username ?? null };
    }
    catch (err) {
        return { accessHash: null, userId: null, username: null };
    }
}
async function safeInviteWithOperator(client, targetEntity, userRow, operatorId) {
    // Try by username first
    if (userRow.username) {
        try {
            const uname = userRow.username.startsWith("@") ? userRow.username : `@${userRow.username}`;
            await client.invoke(new tl_1.Api.channels.InviteToChannel({ channel: targetEntity, users: [uname] }));
            return { success: true, method: "username" };
        }
        catch (e) {
            // continue
        }
    }
    // try accessHash for operator
    const storedAh = await ahRepo.findByUserAndOperator(userRow.id, operatorId);
    let accessHashStr = storedAh?.accessHash ?? null;
    // if none -> resolve and persist
    if (!accessHashStr) {
        const resolved = await resolveEntityAndSave(client, userRow.username ?? String(userRow.userId));
        if (resolved.accessHash && resolved.userId && String(resolved.userId) === String(userRow.userId)) {
            accessHashStr = resolved.accessHash;
            await ahRepo.upsert(userRow.id, operatorId, accessHashStr);
        }
    }
    const uidBig = toBigIntSafe(userRow.userId);
    const ahBig = toBigIntSafe(accessHashStr);
    if (uidBig && ahBig) {
        try {
            await client.invoke(new tl_1.Api.channels.InviteToChannel({
                channel: targetEntity,
                users: [new tl_1.Api.InputUser({ userId: (0, big_integer_1.default)(uidBig), accessHash: (0, big_integer_1.default)(ahBig) })],
            }));
            return { success: true, method: "input_user" };
        }
        catch (err) {
            const msg = String(err?.message ?? err);
            // If INVALID_ID or hash related -> try re-resolve once
            if (/INVALID_ID|USER_ID_INVALID|HASH_INVALID|INVALID_PEER/.test(msg)) {
                const resolved = await resolveEntityAndSave(client, userRow.username ?? String(userRow.userId));
                if (resolved.accessHash) {
                    await ahRepo.upsert(userRow.id, operatorId, resolved.accessHash);
                    const ah2 = toBigIntSafe(resolved.accessHash);
                    try {
                        await client.invoke(new tl_1.Api.channels.InviteToChannel({
                            channel: targetEntity,
                            users: [new tl_1.Api.InputUser({ userId: (0, big_integer_1.default)(uidBig), accessHash: (0, big_integer_1.default)(ah2) })],
                        }));
                        return { success: true, method: "input_user_resolved" };
                    }
                    catch (err2) {
                        return { success: false, reason: String(err2?.message ?? err2) };
                    }
                }
            }
            return { success: false, reason: msg };
        }
    }
    // fallback: export invite link and try DM
    try {
        const exportRes = await client.invoke(new tl_1.Api.messages.ExportChatInvite({ peer: targetEntity }));
        const link = exportRes?.link ?? null;
        if (link) {
            try {
                await client.sendMessage(Number(userRow.userId), { message: `Join: ${link}` });
                return { success: true, method: "invite_link_sent" };
            }
            catch (pmErr) {
                return { success: false, reason: String(pmErr?.message ?? pmErr) };
            }
        }
    }
    catch (e) {
        // ignore
    }
    return { success: false, reason: "no_method_possible" };
}
/**
 * Main entry: add users from DB to a single target groupKey.
 * It will:
 *  - load operators and create clients for them
 *  - load candidate users from DB (unadded for that groupKey)
 *  - assign operators in round-robin and attempt invites
 */
async function addUsersFromDbToGroup(groupKey, targetGroupIdentifier, options) {
    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const batchSize = options?.batchSize ?? 20;
    const operators = await opRepo.getActiveOperators();
    if (!operators.length)
        throw new Error("No active operators found");
    // create clients per operator
    const clientsMap = new Map();
    for (const op of operators) {
        try {
            const client = await createClientForOperator(op.session, apiId, apiHash);
            clientsMap.set(op.id, client);
        }
        catch (err) {
            console.warn(`Failed to connect operator ${op.name}:`, err);
        }
    }
    const aliveOperators = operators.filter(op => clientsMap.has(op.id));
    if (!aliveOperators.length)
        throw new Error("No operator clients available");
    // fetch candidate users
    const toProcess = await userRepo.getUnaddedUsersForGroup(groupKey, batchSize);
    if (!toProcess.length) {
        console.log("No users to add at this time.");
        // disconnect clients
        for (const c of clientsMap.values())
            await c.disconnect();
        return;
    }
    console.log(`Processing ${toProcess.length} users with ${aliveOperators.length} operators.`);
    // round-robin index
    let idx = 0;
    for (const userRow of toProcess) {
        const operator = aliveOperators[idx % aliveOperators.length];
        idx++;
        const client = clientsMap.get(operator.id);
        if (!client)
            continue;
        const alreadyInTarget = await targetMemberRepo.isUserInAnyTarget(userRow.userId);
        if (alreadyInTarget) {
            console.log(`Skipping user ${userRow.username} — already in a target group`);
            await userRepo.updateAddedStatusById(userRow.id, groupKey, "skipped", "duplicate", "already_member");
            await logRepo.create({ operatorId: operator.id, userDbId: userRow.id, groupKey, status: "skipped", method: "duplicate", reason: "already_member" });
            continue;
        }
        const wasKicked = await targetMemberRepo.isUserKicked(userRow.userId);
        if (wasKicked) {
            console.log(`Skipping ${userRow.username} — user was kicked or banned before`);
            await userRepo.updateAddedStatusById(userRow.id, groupKey, "skipped", "kicked", "kicked_or_banned");
            continue;
        }
        console.log(`Inviting user ${userRow.username ?? userRow.userId} using operator ${operator.name}`);
        // attempt invite
        try {
            const res = await safeInviteWithOperator(client, targetGroupIdentifier, userRow, operator.id);
            if (res.success) {
                await userRepo.updateAddedStatusById(userRow.id, groupKey, "success", res.method, res.reason);
                await logRepo.create({ operatorId: operator.id, userDbId: userRow.id, groupKey, status: "success", method: res.method, reason: res.reason });
                console.log(`Success (${res.method})`);
            }
            else {
                await userRepo.updateAddedStatusById(userRow.id, groupKey, "failed", res.method, res.reason);
                await logRepo.create({ operatorId: operator.id, userDbId: userRow.id, groupKey, status: "failed", method: res.method, reason: res.reason });
                console.warn(`Failed: ${res.reason}`);
            }
        }
        catch (outerErr) {
            console.error("Unexpected error inviting:", outerErr);
            await userRepo.updateAddedStatusById(userRow.id, groupKey, "failed", "exception", String(outerErr?.message ?? outerErr));
            await logRepo.create({ operatorId: operator.id, userDbId: userRow.id, groupKey, status: "failed", method: "exception", reason: String(outerErr?.message ?? outerErr) });
        }
        // small randomized sleep to spread invites (e.g. mean ~5min configurable via env)
        const meanMs = Number(process.env.MEAN_DELAY_MS) || 5 * 60 * 1000;
        const jitter = Math.floor(Math.random() * (meanMs * 0.6));
        const delay = Math.max(30 * 1000, Math.floor(meanMs * 0.8) + jitter); // at least 30s
        console.log(`Sleeping ${(delay / 1000).toFixed(0)}s before next invite...`);
        await sleep(delay);
    }
    // disconnect all clients
    for (const c of clientsMap.values())
        await c.disconnect();
    console.log("Finished batch.");
}
