// src/infrastructure/db/repositories/PrismaNewsRepository.ts
import { PrismaClient } from "@prisma/client";
import { News } from "../../../domain/entities/News";

const prisma = new PrismaClient();

export class PrismaNewsRepository {
  async findByLink(link: string): Promise<News | null> {
    return prisma.news.findFirst({ where: {AND:[{link},{posted:true}]  } });
  }

  async save(news: News): Promise<News> {
    const { id, ...data } = news;
    return prisma.news.create({ data: {
        title: data.title,
        link: data.link,
        content: data.content,
        image:data.image,
        source: data.source,
        createdAt: data.createdAt,
        publishedAt: data.publishedAt,
        posted: data.posted} });
  }

  async markAsPosted(id: number): Promise<void> {
    await prisma.news.update({ where: { id }, data: { posted: true } });
  }
}
