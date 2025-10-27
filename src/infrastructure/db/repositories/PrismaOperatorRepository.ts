import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Operator repository for fetching operators and sessions.
 */
export class PrismaOperatorRepository {
  async getActiveOperators() {
    return prisma.operator.findMany({ where: { enabled: true }, orderBy: { id: "asc" } });
  }

  async findById(id: number) {
    return prisma.operator.findUnique({ where: { id } });
  }

  async upsertOperator(data: { name: string; session: string;apiId: number ; apiHash:string; phone?: string ;  }) {
    return prisma.operator.upsert({
      where: { name: data.name },
      create: { name: data.name, session: data.session,apiId:data.apiId,apiHash:data.apiHash, phone: data.phone },
      update: { session: data.session, phone: data.phone },
    });
  }
}