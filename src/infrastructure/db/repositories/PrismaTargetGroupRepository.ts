import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class PrismaTargetGroupRepository {
  async upsertGroup(data: { key: string; username?: string; title?: string; memberCount?: number }) {
    return prisma.targetGroup.upsert({
      where: { key: data.key },
      create: data,
      update: { username: data.username, title: data.title, memberCount: data.memberCount },
    });
  }

  async findByKey(key: string) {
    return prisma.targetGroup.findUnique({ where: { key } });
  }

  async findAll() {
    return prisma.targetGroup.findMany();
  }
}
