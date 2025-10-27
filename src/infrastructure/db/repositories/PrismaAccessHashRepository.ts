import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * AccessHash repository stores per (user,operator) access hashes.
 */
export class PrismaAccessHashRepository {
  async upsert(userDbId: bigint, operatorId: number, accessHash: string) {
    return prisma.accessHash.upsert({
      where: { userId_operatorId: { userId: userDbId, operatorId } },
      create: { userId: userDbId, operatorId, accessHash },
      update: { accessHash },
    });
  }

  async findByUserAndOperator(userDbId: number, operatorId: number) {
    return prisma.accessHash.findUnique({ where: { userId_operatorId: { userId: userDbId, operatorId } } });
  }

  async findForUser(userDbId: number) {
    return prisma.accessHash.findMany({ where: { userId: userDbId } });
  }
}