import { TelegramClient } from "telegram";
import { fetchAllParticipantsHighLevel } from "./fetchAllParticipantsHighLevel";
import { fetchUsersFromMessages } from "./fetchUsersFromMessages";
import { getGroupMemberCount } from "./getGroupMemberCount";


 function convertToMember(members:any[]){
    
    const convScraped = members.reduce(function(result,member){

        //const userId = member.id?member.id:undefined;
        if(!member.bot && !member.deleted){
            result.push({userId: member.id,
            username: member.username,
            firstName: member.firstName,
            lastName: member.lastName,
            accessHash: member.accessHash})
        }
        return result
    },[])
    return convScraped;
 }
/**
 * Try to fetch members via participants. If participants count is clearly incomplete
 * (less than threshold fraction of total), fallback to message-scraping.
 *
 * thresholdFraction default 0.5 => if fetched < 50% of reported total => fallback.
 */
export async function fetchMembersWithFallback(
    client: TelegramClient,
    entity: any,
    opts?: {
      maxMessagesToScan?: number;
      participantsPageLimit?: number;
      thresholdFraction?: number;
    }
  ): Promise<any[]> {
    const maxMessagesToScan = opts?.maxMessagesToScan ?? 5000;
    const pageLimit = opts?.participantsPageLimit ?? 200;
    const thresholdFraction = opts?.thresholdFraction ?? 0.5;
  
    // 1) try to get total count
    const totalCount = await getGroupMemberCount(client, entity);
    console.log(`[fetchMembersWithFallback] reported totalCount = ${totalCount}`);
  
    // 2) try participants fetch
    const participants = await fetchAllParticipantsHighLevel(client, entity, pageLimit);
    console.log(`[fetchMembersWithFallback] participants fetched = ${participants.length}`);
  
    // 3) Decide whether to fallback
    if (totalCount > 0 && participants.length < Math.ceil(totalCount * thresholdFraction)) {
      console.log("[fetchMembersWithFallback] participants seem incomplete -> falling back to message scraping");
      const scraped = await fetchUsersFromMessages(client, entity, maxMessagesToScan, pageLimit);
      console.log(`[fetchMembersWithFallback] scraped users = ${scraped.length}`);
      return convertToMember(scraped);
    }
  
    // 4) If participants are non-empty use them; otherwise if nothing found, fallback too
    if (participants.length > 0) return convertToMember(participants);
  
    console.log("[fetchMembersWithFallback] participants empty, using message scraping fallback");
    const scraped = await fetchUsersFromMessages(client, entity, maxMessagesToScan, pageLimit);
    
    return convertToMember(scraped);
  }