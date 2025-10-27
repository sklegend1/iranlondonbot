"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBotSettingRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaBotSettingRepository {
    async getValue(key) {
        return prisma.botSetting.findUnique({ where: { key } });
    }
    async upsert(key, value, updatedBy) {
        return prisma.botSetting.upsert({
            where: { key },
            update: { value, updatedBy },
            create: { key, value, updatedBy },
        });
    }
    async getAllSettings() {
        return prisma.botSetting.findMany();
    }
}
exports.PrismaBotSettingRepository = PrismaBotSettingRepository;
