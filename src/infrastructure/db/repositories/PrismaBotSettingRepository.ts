import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PrismaBotSettingRepository {
  async getValue(key: string) {
    return prisma.botSetting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: string, updatedBy?: number) {
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
