import { Category } from "../entities/Category";

export interface CategoryRepository {
  create(category: Category): Promise<Category>;
  findById(id: number): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  update(category: Category): Promise<Category>;
  delete(id: number): Promise<void>;
}