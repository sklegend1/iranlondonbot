"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaNewsRepository = void 0;
// src/infrastructure/db/repositories/PrismaNewsRepository.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaNewsRepository {
    async findByLink(link) {
        return prisma.news.findFirst({ where: { AND: [{ link }, { posted: true }] } });
    }
    async save(news) {
        const { id, ...data } = news;
        return prisma.news.create({ data: {
                title: data.title,
                link: data.link,
                content: data.content,
                image: data.image,
                source: data.source,
                createdAt: data.createdAt,
                publishedAt: data.publishedAt,
                posted: data.posted
            } });
    }
    async markAsPosted(id) {
        await prisma.news.update({ where: { id }, data: { posted: true } });
    }
}
exports.PrismaNewsRepository = PrismaNewsRepository;
