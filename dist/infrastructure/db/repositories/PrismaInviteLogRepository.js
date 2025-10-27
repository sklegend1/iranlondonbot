"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaInviteLogRepository = void 0;
// src/infrastructure/db/repositories/PrismaInviteLogRepository.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaInviteLogRepository {
    async create(params) {
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
exports.PrismaInviteLogRepository = PrismaInviteLogRepository;
