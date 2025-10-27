"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAdRepository = void 0;
const prismaClient_1 = require("../prismaClient");
class PrismaAdRepository {
    async create(ad) {
        // Use Prisma to insert into DB
        console.log("Creating ad in DB:", ad);
        const created = await prismaClient_1.prisma.ad.create({
            data: {
                messageId: null,
                content: ad.content,
                imageUrl: ad.imageUrl,
                categoryId: ad.categoryId,
                userId: ad.userId,
                startAt: ad.startAt,
                endAt: ad.endAt,
                verified: ad.verified ? true : false,
                receiptText: ad.receiptText ? ad.receiptText : null,
                receiptUrl: ad.receiptUrl ? ad.receiptUrl : null,
            },
        });
        return created;
    }
    async findById(id) {
        return await prismaClient_1.prisma.ad.findUnique({ where: { id } });
    }
    async findManyByUserId(userId) {
        return await prismaClient_1.prisma.ad.findMany({ where: { userId } });
    }
    async findAll() {
        return await prismaClient_1.prisma.ad.findMany();
    }
    async findUnverifiedAds() {
        return await prismaClient_1.prisma.ad.findMany({ where: { verified: false } });
    }
    async update(ad) {
        if (!ad.id) {
            throw new Error("Ad ID is required for update");
        }
        return await prismaClient_1.prisma.ad.update({
            where: { id: ad.id },
            data: {
                id: ad.id,
                messageId: ad.messageId,
                content: ad.content,
                imageUrl: ad.imageUrl,
                categoryId: ad.categoryId,
                userId: ad.userId,
                startAt: ad.startAt,
                endAt: ad.endAt,
                verified: ad.verified ? true : false,
                receiptText: ad.receiptText ? ad.receiptText : null,
                receiptUrl: ad.receiptUrl ? ad.receiptUrl : null,
            },
        });
    }
    async delete(id) {
        await prismaClient_1.prisma.ad.delete({ where: { id } });
    }
}
exports.PrismaAdRepository = PrismaAdRepository;
