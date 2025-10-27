"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTargetGroupMemberRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaTargetGroupMemberRepository {
    async addOrUpdateMember(groupId, user) {
        const userIdBig = BigInt(String(user.userId));
        return prisma.targetGroupMember.upsert({
            where: { groupId_userId: { groupId, userId: userIdBig } },
            create: {
                groupId,
                userId: userIdBig,
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
    async isUserInAnyTarget(userId) {
        const count = await prisma.targetGroupMember.count({
            where: {
                userId: BigInt(String(userId)),
                status: { in: ["active"] },
            },
        });
        return count > 0;
    }
    async isUserKicked(userId) {
        const kicked = await prisma.targetGroupMember.count({
            where: {
                userId: BigInt(String(userId)),
                status: { in: ["kicked", "banned"] },
            },
        });
        return kicked > 0;
    }
}
exports.PrismaTargetGroupMemberRepository = PrismaTargetGroupMemberRepository;
