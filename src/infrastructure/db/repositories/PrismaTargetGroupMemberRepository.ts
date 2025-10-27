import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class PrismaTargetGroupMemberRepository {
  async addOrUpdateMember(groupId: number, user: {
    userId: bigint | string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    status?: string;
  }) {
    const userIdBig = BigInt(String(user.userId));
    return prisma.targetGroupMember.upsert({
      where: { groupId_userId: { groupId, userId: userIdBig as any } },
      create: {
        groupId,
        userId: userIdBig as any,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status ?? "active",
      },
      update: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status ?? "active",
      },
    });
  }

  async isUserInAnyTarget(userId: bigint | string): Promise<boolean> {
    const count = await prisma.targetGroupMember.count({
      where: {
        userId: BigInt(String(userId)) as any,
        status: { in: ["active"] },
      },
    });
    return count > 0;
  }

  async isUserKicked(userId: bigint | string): Promise<boolean> {
    const kicked = await prisma.targetGroupMember.count({
      where: {
        userId: BigInt(String(userId)) as any,
        status: { in: ["kicked", "banned"] },
      },
    });
    return kicked > 0;
  }
}
