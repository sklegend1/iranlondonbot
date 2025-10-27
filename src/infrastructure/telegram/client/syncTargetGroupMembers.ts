import { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import bigInt from "big-integer";
import { PrismaTargetGroupRepository } from "../../db/repositories/PrismaTargetGroupRepository";
import { PrismaTargetGroupMemberRepository } from "../../db/repositories/PrismaTargetGroupMemberRepository";

const groupRepo = new PrismaTargetGroupRepository();
const memberRepo = new PrismaTargetGroupMemberRepository();

// Filters to cover all member types
const filters = [
  { filter: new Api.ChannelParticipantsRecent(), status: "active" },
  { filter: new Api.ChannelParticipantsAdmins(), status: "admin" },
  { filter: new Api.ChannelParticipantsBots(), status: "bot" },
  { filter: new Api.ChannelParticipantsKicked({q:""}), status: "kicked" },
  { filter: new Api.ChannelParticipantsBanned({q:""}), status: "banned" },
];

export async function syncTargetGroupMembers(
  client: TelegramClient,
  groupKey: string,
  groupIdentifier: string
) {
  const entity: any = await client.getEntity(groupIdentifier);
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
      const res: any = await client.invoke(
        new Api.channels.GetParticipants({
          channel: entity,
          filter,
          offset,
          limit,
          hash: bigInt(0),
        })
      );

      const participants = res.participants;
      const usersMap = new Map(res.users.map((u: any) => [u.id.toString(), u]));

      if (!participants.length) break;
      //console.log(participants[2]);
      for (const p of participants) {
        let u:any
        if(status === 'kicked' || status === 'banned') {
          u = usersMap.get(p.userId?.toString()) || usersMap.get(p.peer.userId?.toString());
        }
        else{
            u = usersMap.get(p.userId?.toString());
        }
        if (!u) continue;
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
