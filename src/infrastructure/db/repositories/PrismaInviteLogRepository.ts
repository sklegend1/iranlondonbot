// src/infrastructure/db/repositories/PrismaInviteLogRepository.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class PrismaInviteLogRepository {
  async create(params: { operatorId?: number; userDbId?: number; groupKey?: string; status: string; method?: string; reason?: string }) {
    return prisma.inviteLog.create({
      data: {
        operatorId: params.operatorId ?? null,
        userId: params.userDbId ?? null,
        groupKey: params.groupKey ?? null,
        status: params.status,
        method: params.method ?? null,
        reason: params.reason ?? null,
      },
    });
  }
}
