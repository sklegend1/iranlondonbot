import { prisma } from "../prismaClient";

export class PrismaUserRepository {
  async findByTelegramId(telegramId: number) {
    return prisma.user.findUnique({ where: { telegramId } });
  }

  async findAdmins() {
    return prisma.user.findMany({ where: { isAdmin: true } });
  }

  async createOrUpdate(data: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
  }) {
    const existing = await this.findByTelegramId(data.telegramId);
    if (existing) return existing;

    return prisma.user.create({ data });
  }
}
