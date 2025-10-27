"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCategoryRepository = void 0;
const prismaClient_1 = require("../prismaClient");
class PrismaCategoryRepository {
    async create(cat) {
        // Use Prisma to insert into DB
        const created = await prismaClient_1.prisma.category.create({
            data: {
                name: cat.name,
                price: cat.price,
            },
        });
        return created;
    }
    async findById(id) {
        return await prismaClient_1.prisma.category.findUnique({ where: { id } });
    }
    async findAll() {
        return await prismaClient_1.prisma.category.findMany();
    }
    async update(cat) {
        if (!cat.id) {
            throw new Error("cat ID is required for update");
        }
        return await prismaClient_1.prisma.category.update({
            where: { id: cat.id },
            data: {
                id: cat.id,
                name: cat.name,
                price: cat.price,
            },
        });
    }
    async delete(id) {
        await prismaClient_1.prisma.category.delete({ where: { id } });
    }
}
exports.PrismaCategoryRepository = PrismaCategoryRepository;
