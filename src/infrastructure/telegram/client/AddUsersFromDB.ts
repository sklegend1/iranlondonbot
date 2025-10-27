import { Api, TelegramClient } from "telegram";
import { PrismaScrapedUserRepository } from "../../db/repositories/PrismaScrapedUserRepository";
import { sleep } from "../../helpers/sleep";
import { toBigIntOrLong } from "../../helpers/ToBigIntOrLong";
import Long from "long";
import bigInt from "big-integer";
import { getEntity } from "telegram/client/users";
const repo = new PrismaScrapedUserRepository();

// helper: try to resolve user entity and return accessHash (or null)
async function resolveAccessHash(client: TelegramClient, identifier: string | number | bigInt.BigInteger,aHash:bigInt.BigInteger) {
  try {
    // client.getEntity accepts username, numeric id or InputPeer
    const ent = await client.invoke(
      new Api.users.GetFullUser(
      { id : new Api.InputUser ({userId:identifier as bigInt.BigInteger,accessHash:aHash})}
      ) );
    console.log(identifier)
    //console.log(ent)
    // ent may have accessHash or access_hash (depends on gramjs version)
    const ah = (ent as any).accessHash ?? (ent as any).access_hash ?? (ent as any).accessHashBigInt;
    if (ah === undefined || ah === null) return null;
    // normalize to BigInt if possible
    try { return BigInt(ah); } catch { return ah; }
  } catch (err) {
    console.log(err)
    // couldn't resolve entity (private user / blocked / not accessible)
    return null;
  }
}

export async function addUsersFromDB(client: TelegramClient, sourceGroup: string, targetGroup: string) {
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
        
      console.log(`[Action] Adding user ${ bigInt(user.userId.toString())} as ${user.firstName} ${user.lastName?user.lastName:''}`);
        const targetUser = new Api.InputUser({
                
              userId: bigInt(user.userId.toString())  ,
              accessHash: bigInt(0),
            })
      const result = await client.invoke(
        new Api.channels.InviteToChannel({
          channel: targetGroup,
          users: [
            targetUser
           // user.username?(user.username.startsWith("@") ? user.username : `@${user.username}`):targetUser
          ],
        })
      );
      // // console.log(result)

      console.log(`[Success] Added ${user.username || user.userId}`);
      await repo.updateAddedStatusById(user.id, targetGroup, "success");
      addedCount++;

      const randomDelay = 240000 +( Math.random() * 120000); // 4~6 min
      console.log(`[Wait] Sleeping ${(randomDelay / 1000 / 60).toFixed(1)} minutes...`);
      await sleep(randomDelay);
      
      if (addedCount >= 20) {
        console.log(`[Limit Reached] 20 users added today.`);
        break;
      }
    } catch (err: any) {
      console.log(`[Error] Could not add ${user.username}: ${err.message}`);
      await repo.updateAddedStatusById(user.id, targetGroup, "failed");

      const randomDelay = 240000 +( Math.random() * 120000); // 4~6 min
      console.log(`[Wait] Sleeping ${(randomDelay / 1000 / 60).toFixed(1)} minutes...`);
      await sleep(randomDelay);
      continue;
    }
  }

  console.log(`[Done] Finished adding users to ${targetGroup}`);
}
