"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaScrapedUserRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Repository for ScrapedUser with access to accessHashes via relation.
 */
class PrismaScrapedUserRepository {
    async upsertUser(params) {
        const userIdBig = BigInt(String(params.userId));
        return prisma.scrapedUser.upsert({
            where: { userId: userIdBig },
            create: {
                userId: userIdBig,
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
    async getUnaddedUsersForGroup(groupKey, limit = 50) {
        // Return users that don't have success for the groupKey
        const users = await prisma.scrapedUser.findMany({ take: 1000 }); // fetch a batch then filter in app
        return users.filter((u) => {
            const added = u.added || {};
            return !(added[groupKey] && added[groupKey].status === "success");
        }).slice(0, limit);
    }
    async updateAddedStatusById(dbId, groupKey, status, method, reason) {
        const user = await prisma.scrapedUser.findUnique({ where: { id: dbId } });
        const added = user?.added || {};
        added[groupKey] = { addedAt: Date.now(), status, method: method ?? null, reason: reason ?? null };
        return prisma.scrapedUser.update({ where: { id: dbId }, data: { added } });
    }
    // helper to find user by userId
    async findByUserId(userId) {
        return prisma.scrapedUser.findUnique({ where: { userId: BigInt(String(userId)) } });
    }
}
exports.PrismaScrapedUserRepository = PrismaScrapedUserRepository;
