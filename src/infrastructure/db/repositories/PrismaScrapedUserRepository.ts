import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Repository for ScrapedUser with access to accessHashes via relation.
 */
export class PrismaScrapedUserRepository {
  async upsertUser(params: {
    userId: bigint | string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }) {
    const userIdBig = BigInt(String(params.userId));
    return prisma.scrapedUser.upsert({
      where: { userId: userIdBig as any },
      create: {
        userId: userIdBig as any,
        username: params.username,
        firstName: params.firstName,
        lastName: params.lastName,
      },
      update: {
        username: params.username,
        firstName: params.firstName,
        lastName: params.lastName,
      },
    });
  }

  async getUnaddedUsersForGroup(groupKey: string, limit = 50) {
    // Return users that don't have success for the groupKey
    const users = await prisma.scrapedUser.findMany({ take: 1000 }); // fetch a batch then filter in app
    return users.filter((u) => {
      const added = (u.added as any) || {};
      return !(added[groupKey] && added[groupKey].status === "success");
    }).slice(0, limit);
  }

  async updateAddedStatusById(dbId: number, groupKey: string, status: string, method?: string, reason?: string) {
    const user = await prisma.scrapedUser.findUnique({ where: { id: dbId } });
    const added = (user?.added as any) || {};
    added[groupKey] = { addedAt: Date.now(), status, method: method ?? null, reason: reason ?? null };
    return prisma.scrapedUser.update({ where: { id: dbId }, data: { added } });
  }

  // helper to find user by userId
  async findByUserId(userId: bigint | string) {
    return prisma.scrapedUser.findUnique({ where: { userId: BigInt(String(userId)) as any } });
  }
}