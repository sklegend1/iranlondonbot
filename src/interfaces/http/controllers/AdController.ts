import { Request, Response } from "express";
import { PrismaAdRepository } from "../../../infrastructure/db/repositories/PrismaAdRepository";
import { CreateAd } from "../../../application/use-cases/CreateAd";
import { ScheduleAdJobs } from "../../../infrastructure/queue/ScheduleAdJobs";

const adRepository = new PrismaAdRepository();
const createAdUseCase = new CreateAd(adRepository);

export class AdController {
  static async create(req: Request, res: Response) {
    try {
      const { content, imageUrl, categoryId, userId, startAt, endAt } = req.body;

      const scheduler = new ScheduleAdJobs();

      const ad = await createAdUseCase.execute({
        messageId:null,
        content,
        imageUrl,
        categoryId,
        userId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        verified: false,
        receiptText:  null,
        receiptUrl:  null
      });
      await scheduler.execute(ad);
      
      res.status(201).json(ad);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
