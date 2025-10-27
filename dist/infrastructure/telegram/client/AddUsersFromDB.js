"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUsersFromDB = addUsersFromDB;
const telegram_1 = require("telegram");
const PrismaScrapedUserRepository_1 = require("../../db/repositories/PrismaScrapedUserRepository");
const sleep_1 = require("../../helpers/sleep");
const big_integer_1 = __importDefault(require("big-integer"));
const repo = new PrismaScrapedUserRepository_1.PrismaScrapedUserRepository();
// helper: try to resolve user entity and return accessHash (or null)
async function resolveAccessHash(client, identifier, aHash) {
    try {
        // client.getEntity accepts username, numeric id or InputPeer
        const ent = await client.invoke(new telegram_1.Api.users.GetFullUser({ id: new telegram_1.Api.InputUser({ userId: identifier, accessHash: aHash }) }));
        console.log(identifier);
        //console.log(ent)
        // ent may have accessHash or access_hash (depends on gramjs version)
        const ah = ent.accessHash ?? ent.access_hash ?? ent.accessHashBigInt;
        if (ah === undefined || ah === null)
            return null;
        // normalize to BigInt if possible
        try {
            return BigInt(ah);
        }
        catch {
            return ah;
        }
    }
    catch (err) {
        console.log(err);
        // couldn't resolve entity (private user / blocked / not accessible)
        return null;
    }
}
async function addUsersFromDB(client, sourceGroup, targetGroup) {
    console.log(`[Start] Adding users from ${sourceGroup} → ${targetGroup}`);
    const users = await repo.getUnaddedUsersForGroup(targetGroup, 20);
    console.log(`[Info] Found ${users.length} users to process`);
    let addedCount = 0;
    for (const user of users) {
        try {
            // if(!user.username) {
            //   const fullUser = await resolveAccessHash(client,bigInt(user.userId),bigInt(user.accessHash!))
            //   console.log(fullUser)
            //   continue
            //   };
            console.log(`[Action] Adding user ${(0, big_integer_1.default)(user.userId.toString())} as ${user.firstName} ${user.lastName ? user.lastName : ''}`);
            const targetUser = new telegram_1.Api.InputUser({
                userId: (0, big_integer_1.default)(user.userId.toString()),
                accessHash: (0, big_integer_1.default)(0),
            });
            const result = await client.invoke(new telegram_1.Api.channels.InviteToChannel({
                channel: targetGroup,
                users: [
                    targetUser
                    // user.username?(user.username.startsWith("@") ? user.username : `@${user.username}`):targetUser
                ],
            }));
            // // console.log(result)
            console.log(`[Success] Added ${user.username || user.userId}`);
            await repo.updateAddedStatusById(user.id, targetGroup, "success");
            addedCount++;
            const randomDelay = 240000 + (Math.random() * 120000); // 4~6 min
            console.log(`[Wait] Sleeping ${(randomDelay / 1000 / 60).toFixed(1)} minutes...`);
            await (0, sleep_1.sleep)(randomDelay);
            if (addedCount >= 20) {
                console.log(`[Limit Reached] 20 users added today.`);
                break;
            }
        }
        catch (err) {
            console.log(`[Error] Could not add ${user.username}: ${err.message}`);
            await repo.updateAddedStatusById(user.id, targetGroup, "failed");
            const randomDelay = 240000 + (Math.random() * 120000); // 4~6 min
            console.log(`[Wait] Sleeping ${(randomDelay / 1000 / 60).toFixed(1)} minutes...`);
            await (0, sleep_1.sleep)(randomDelay);
            continue;
        }
    }
    console.log(`[Done] Finished adding users to ${targetGroup}`);
}
