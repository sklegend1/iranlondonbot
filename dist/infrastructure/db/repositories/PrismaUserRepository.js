"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const prismaClient_1 = require("../prismaClient");
class PrismaUserRepository {
    async findByTelegramId(telegramId) {
        return prismaClient_1.prisma.user.findUnique({ where: { telegramId } });
    }
    async createOrUpdate(data) {
        const existing = await this.findByTelegramId(data.telegramId);
        if (existing)
            return existing;
        return prismaClient_1.prisma.user.create({ data });
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
