"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTargetGroupRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaTargetGroupRepository {
    async upsertGroup(data) {
        return prisma.targetGroup.upsert({
            where: { key: data.key },
            create: data,
            update: { username: data.username, title: data.title, memberCount: data.memberCount },
        });
    }
    async findByKey(key) {
        return prisma.targetGroup.findUnique({ where: { key } });
    }
    async findAll() {
        return prisma.targetGroup.findMany();
    }
}
exports.PrismaTargetGroupRepository = PrismaTargetGroupRepository;
