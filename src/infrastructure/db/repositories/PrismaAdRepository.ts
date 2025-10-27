import { prisma } from "../prismaClient";
import { Ad } from "../../../domain/entities/Ad";
import { AdRepository } from "../../../domain/repositories/AdRepository";

export class PrismaAdRepository implements AdRepository {
  async create(ad: Ad): Promise<Ad> {
    // Use Prisma to insert into DB
    console.log("Creating ad in DB:", ad);
    const created = await prisma.ad.create({
      data: {
        messageId: null,
        content: ad.content,
        imageUrl: ad.imageUrl,
        categoryId: ad.categoryId,
        userId: ad.userId,
        startAt: ad.startAt,
        endAt: ad.endAt,
        verified: ad.verified? true:false ,
        receiptText: ad.receiptText? ad.receiptText : null,
        receiptUrl: ad.receiptUrl? ad.receiptUrl : null,
      },
    });
    return created;
  }

  async findById(id: number): Promise<Ad | null> {
    return await prisma.ad.findUnique({ where: { id } });
  }

  async findManyByUserId(userId: number): Promise<Ad[]> {
    return await prisma.ad.findMany({ where: { userId } });
  }

  async findAll(): Promise<Ad[]> {
    return await prisma.ad.findMany();
  }

  async findUnverifiedAds(): Promise<Ad[]> {
    return await prisma.ad.findMany({ where: { verified: false } });
  }

  async update(ad: Ad): Promise<Ad> {
    if (!ad.id) {
      throw new Error("Ad ID is required for update");
    }
    return await prisma.ad.update({
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
        verified: ad.verified? true:false ,
        receiptText: ad.receiptText? ad.receiptText : null,
        receiptUrl: ad.receiptUrl? ad.receiptUrl : null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.ad.delete({ where: { id } });
  }
}
