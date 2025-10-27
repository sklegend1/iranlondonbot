import { prisma } from "../prismaClient";
import { Ad } from "../../../domain/entities/Ad";

import { CategoryRepository } from "../../../domain/repositories/CategoryRepository";
import { Category } from "../../../domain/entities/Category";

export class PrismaCategoryRepository implements CategoryRepository {
  async create(cat:Category): Promise<Category> {
    // Use Prisma to insert into DB
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        price: cat.price,
      },
    });
    return created;
  }

  async findById(id: number): Promise<Category | null> {
    return await prisma.category.findUnique({ where: { id } });
  }

  async findAll(): Promise<Category[]> {
    return await prisma.category.findMany();
  }

  async update(cat: Category): Promise<Category> {
    if (!cat.id) {
      throw new Error("cat ID is required for update");
    }
    return await prisma.category.update({
      where: { id: cat.id },
      data: {
        id: cat.id,
        name: cat.name,
        price: cat.price,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }
}
