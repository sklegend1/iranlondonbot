"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaOperatorRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Operator repository for fetching operators and sessions.
 */
class PrismaOperatorRepository {
    async getActiveOperators() {
        return prisma.operator.findMany({ where: { enabled: true }, orderBy: { id: "asc" } });
    }
    async findById(id) {
        return prisma.operator.findUnique({ where: { id } });
    }
    async upsertOperator(data) {
        return prisma.operator.upsert({
            where: { name: data.name },
            create: { name: data.name, session: data.session, apiId: data.apiId, apiHash: data.apiHash, phone: data.phone },
            update: { session: data.session, phone: data.phone },
        });
    }
}
exports.PrismaOperatorRepository = PrismaOperatorRepository;
