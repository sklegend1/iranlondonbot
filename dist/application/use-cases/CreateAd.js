"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAd = void 0;
class CreateAd {
    constructor(adRepository) {
        this.adRepository = adRepository;
    }
    async execute(request) {
        // Basic validation
        if (!request.content) {
            throw new Error("Ad content is required");
        }
        if (request.startAt >= request.endAt) {
            throw new Error("Start date must be before end date");
        }
        const ad = {
            messageId: null, // Will be set after posting to Telegram
            content: request.content,
            imageUrl: request.imageUrl,
            categoryId: request.categoryId,
            userId: request.userId,
            startAt: request.startAt,
            endAt: request.endAt,
            verified: request.verified ? true : false,
            receiptText: request.receiptText ? request.receiptText : null,
            receiptUrl: request.receiptUrl ? request.receiptUrl : null,
        };
        return await this.adRepository.create(ad);
    }
}
exports.CreateAd = CreateAd;
