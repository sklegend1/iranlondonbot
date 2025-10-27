// src/infrastructure/telegram/client/AddUsersFromOldGroup.ts
/**
 * Add members from one group to another using a user client (gramjs).
 * - Uses client.getParticipants (high-level) when possible to avoid manual BigInt issues.
 * - When low-level Api types are required, converts numeric ids to BigInt or Long as needed.
 * - start() is called with auth callbacks (authParams).
 *
 * All comments are in English.
 */

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
//import input from "input";
import Long from "long";
import { PrismaClient } from "@prisma/client";
import { fetchMembersWithFallback } from "./utils/fetchMembersWithFallback";
import { PrismaScrapedUserRepository } from "../../db/repositories/PrismaScrapedUserRepository";
import { toBigIntOrLong } from "../../helpers/ToBigIntOrLong";
import { PrismaAccessHashRepository } from "../../db/repositories/PrismaAccessHashRepository";
const input = require("input"); // npm install input

require("dotenv").config();

// --------- CONFIG ----------
const apiId = Number(process.env.TELEGRAM_API_ID2);
const apiHash = process.env.TELEGRAM_API_HASH2!;
const sessionString = process.env.TELEGRAM_STRING_SESSION2 || ""; // saved session from initial login (may be empty)
const maxAddsPerDay = Number(process.env.MAX_ADDS_PER_DAY) || 10; // default 20
const meanDelayMs = Number(process.env.MEAN_DELAY_MS) || 5 * 60 * 1000; // mean ~5 minutes
const maxDelayMs = Number(process.env.MAX_DELAY_MS) || 10 * 60 * 1000; // cap delay e.g. 20 minutes
const minDelayMs = Number(process.env.MIN_DELAY_MS) || 180 * 1000; // at least 30s between attempts

// --------- Helpers ----------
const prisma = new PrismaClient();
const repo = new PrismaScrapedUserRepository();
const accessHashRepo = new PrismaAccessHashRepository();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sample from exponential distribution with given mean,
 * then clamp to [min, max].
 */
function sampleExponentialMean(mean: number, min: number, max: number) {
  const u = Math.random();
  const raw = -mean * Math.log(1 - u);
  const clamped = Math.max(min, Math.min(max, Math.round(raw)));
  return clamped;
}





/**
 * Count successful invites in last 24h.
 */
async function countAddsLast24Hours(operatorId?: number) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where: any = {
    status: "success",
    createdAt: { gte: since },
  };
  if (operatorId) where.operatorId = operatorId;
  return prisma.inviteLog.count({ where });
}

/**
 * Log invite attempt.
 */
// async function logInvite(params: {
//   operatorId?: number;
//   telegramId?: number | bigint;
//   username?: string | null;
//   status: "success" | "failed" | "skipped";
//   reason?: string | null;
// }) {
//   await prisma.inviteLog.create({
//     data: {
//       operatorId: params.operatorId ?? null,
//       telegramId: params.telegramId ? BigInt(params.telegramId) : null,
//       username: params.username ?? null,
//       status: params.status,
//       reason: params.reason ?? null,
//     },
//   });
// }

/**
 * Build an invite target:
 * - prefer username (string) if available
 * - else build Api.InputUser with userId + accessHash (converted)
 */
function buildInviteTargetForUser(user: any) {
  if (user.username) return user.username;
  // if accessHash is not present, return numeric id (gramjs might accept it)
  const userId = user.id ?? user.userId;
  const accessHash = user.accessHash ?? user.access_hash ?? user.accessHashBigInt;
  // If accessHash missing, return numeric id (some invites may still work with username/id)
  if (!accessHash) return userId;
  return new Api.InputUser({
    userId: toBigIntOrLong(userId),
    accessHash: toBigIntOrLong(accessHash),
  });
}


  


// --------- Main ----------
export async function addGroupUsersToDB(apiId : number, apiHash : string) {
  if (!apiId || !apiHash) {
    console.error("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env");
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  // start with explicit auth callbacks (authParams)
  await client.start({
    phoneNumber: async () => await input.text("📞 Enter your phone number (or press Enter if session present): "),
    phoneCode: async () => await input.text("📨 Enter the code you received (if any): "),
    password: async () => await input.text("🔑 Enter 2FA password (if any): "),
    onError: (err) => console.error("Auth error:", err),
  });

  console.log("✅ Logged in (session active).");

  const operatorIdText = await input.text("Enter your local operator id (optional): ");
  const operatorId = operatorIdText ? Number(operatorIdText) : -1;

  const oldGroup = await input.text("Enter OLD group username or invite link (without @ for username): ");
  const newGroup = await input.text("Enter NEW group username or invite link (without @ for username): ");

  // Resolve entities (getEntity works for usernames or invite link InputPeer/Channel)
  let oldEntity: any;
  let newEntity: any;
  try {
    oldEntity = await client.getEntity(oldGroup);
    newEntity = await client.getEntity(newGroup);
  } catch (err: any) {
    console.error("Failed to resolve group entities:", err);
    await client.disconnect();
    process.exit(1);
  }

  console.log("Fetching participants from old group (this may take a while)...");
  //const oldUsers = await fetchAllParticipants(client, oldEntity);
  const oldUsers = await fetchMembersWithFallback(client, oldEntity); // fetch up to 10k messages
  console.log(`Found ${oldUsers.length} users in the source group.`);
  // const newUsers = await fetchMembersWithFallback(client, newEntity);
  // const allUsers =oldUsers.filter((id) => !newUsers.includes(id));
  const allUsers = oldUsers
  console.log(`Found ${allUsers.length} users in the source group.`);
  
  try {
    //console.log(Object.keys(allUsers[2]))
    for (const tgUser of allUsers){
      //console.log(tgUser)
      await repo.upsertUser(tgUser)
      await accessHashRepo.upsert((tgUser.userId),operatorId!, tgUser.accessHash ?? tgUser.access_hash ?? tgUser.accessHashBigInt)

    }
    console.log(`${allUsers.length} members successfuly added to database`)
    
  } catch (error) {
    console.log(error)
  }
//   for (const user of allUsers) {
//     try {
//       // check daily cap
//       const addedCount = await countAddsLast24Hours(operatorId);
//       if (addedCount >= maxAddsPerDay) {
//         console.log(`Daily add limit reached (${addedCount}/${maxAddsPerDay}). Stopping.`);
//         break;
//       }

//       // skip bots and deleted accounts
//       if (user.bot || user.deleted) {
//         console.log(`Skipping bot/deleted: ${user.username ?? user.id}`);
//         await logInvite({
//           operatorId,
//           telegramId: user.id,
//           username: user.username ?? null,
//           status: "skipped",
//           reason: "bot_or_deleted",
//         });
//         continue;
//       }

//       // build invite target (prefer username)
//       const inviteTarget = buildInviteTargetForUser(user);

//       try {
//         // try to invite: prefer passing username string; otherwise pass InputUser
//         let inviteArg: any;
//         if (typeof inviteTarget === "string") {
//           // username (without leading @)
//           const name = inviteTarget.startsWith("@") ? inviteTarget : `@${inviteTarget}`;
//           // high-level helper may accept name, but to be safe we pass entity and username as string
//           await client.invoke(
//             new Api.channels.InviteToChannel({
//               channel: newEntity,
//               users: [name],
//             })
//           );
//         } else {
//           // InputUser (with BigInt/Long)
//           await client.invoke(
//             new Api.channels.InviteToChannel({
//               channel: newEntity,
//               users: [inviteTarget],
//             })
//           );
//         }

//         console.log(`Added ${user.username ?? user.id} successfully.`);
//         await logInvite({
//           operatorId,
//           telegramId: user.id,
//           username: user.username ?? null,
//           status: "success",
//         });
//       } catch (inviteErr: any) {
//         const msg = inviteErr?.message ?? String(inviteErr);
//         console.warn(`Invite failed for ${user.username ?? user.id}: ${msg}`);

//         // detect FLOOD_WAIT error
//         const floodMatch = /FLOOD_WAIT_(\d+)/.exec(msg) || /FLOOD_WAIT (\d+)/.exec(msg);
//         if (floodMatch) {
//           const waitSec = Number(floodMatch[1]) || 60;
//           const waitMs = waitSec * 1000;
//           console.warn(`Encountered FloodWait for ${waitSec}s. Sleeping...`);
//           await sleep(waitMs + 5000);
//         } else {
//           // generic backoff
//           const backoffMs = Math.min(maxDelayMs, meanDelayMs * 2);
//           console.warn(`Generic error. Backing off ${Math.round(backoffMs / 1000)}s`);
//           await sleep(backoffMs);
//         }

//         await logInvite({
//           operatorId,
//           telegramId: user.id,
//           username: user.username ?? null,
//           status: "failed",
//           reason: msg,
//         });
//       }

//       // randomized delay before next invite
//     //   const delayMs = sampleExponentialMean(meanDelayMs, minDelayMs, maxDelayMs);
//       let delayMs =  0; // no delay
//       while(delayMs<minDelayMs || delayMs>maxDelayMs){
//         delayMs = Math.random() * meanDelayMs * 2;
//       }
//       console.log(`Waiting ${Math.round(delayMs / 1000)}s before next invite...`);
//       await sleep(delayMs);
//     } catch (outerErr: any) {
//       console.error("Unexpected loop error:", outerErr);
//       await sleep(60 * 1000);
//     }
//   }

  console.log("Completed transfer loop. Disconnecting...");
  await client.disconnect();
  await prisma.$disconnect();
  process.exit(0);
};


   addGroupUsersToDB(apiId, apiHash)
