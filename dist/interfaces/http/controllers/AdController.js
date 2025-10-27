"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdController = void 0;
const PrismaAdRepository_1 = require("../../../infrastructure/db/repositories/PrismaAdRepository");
const CreateAd_1 = require("../../../application/use-cases/CreateAd");
const ScheduleAdJobs_1 = require("../../../application/use-cases/ScheduleAdJobs");
const adRepository = new PrismaAdRepository_1.PrismaAdRepository();
const createAdUseCase = new CreateAd_1.CreateAd(adRepository);
class AdController {
    static async create(req, res) {
        try {
            const { content, imageUrl, categoryId, userId, startAt, endAt } = req.body;
            const scheduler = new ScheduleAdJobs_1.ScheduleAdJobs();
            const ad = await createAdUseCase.execute({
                messageId: null,
                content,
                imageUrl,
                categoryId,
                userId,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                verified: false,
                receiptText: null,
                receiptUrl: null
            });
            await scheduler.execute(ad);
            res.status(201).json(ad);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AdController = AdController;
