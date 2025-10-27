"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAccessHashRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * AccessHash repository stores per (user,operator) access hashes.
 */
class PrismaAccessHashRepository {
    async upsert(userDbId, operatorId, accessHash) {
        return prisma.accessHash.upsert({
            where: { userId_operatorId: { userId: userDbId, operatorId } },
            create: { userId: userDbId, operatorId, accessHash },
            update: { accessHash },
        });
    }
    async findByUserAndOperator(userDbId, operatorId) {
        return prisma.accessHash.findUnique({ where: { userId_operatorId: { userId: userDbId, operatorId } } });
    }
    async findForUser(userDbId) {
        return prisma.accessHash.findMany({ where: { userId: userDbId } });
    }
}
exports.PrismaAccessHashRepository = PrismaAccessHashRepository;
