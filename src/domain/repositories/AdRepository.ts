import { Ad } from "../entities/Ad";

export interface AdRepository {
  create(ad: Ad): Promise<Ad>;
  findById(id: number): Promise<Ad | null>;
  findAll(): Promise<Ad[]>;
  update(ad: Ad): Promise<Ad>;
}
