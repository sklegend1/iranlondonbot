"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAd = void 0;
class UpdateAd {
    constructor(adRepository) {
        this.adRepository = adRepository;
    }
    async execute(request) {
        console.log("Updating ad:", request);
        // Basic validation
        if (!request.content) {
            throw new Error("Ad content is required");
        }
        if (request.startAt >= request.endAt) {
            throw new Error("Start date must be before end date");
        }
        if (!request.messageId) {
            throw new Error("Ad MessageID is required for update");
        }
        const ad = {
            id: request.id, // Use messageId as the unique identifier for update
            messageId: request.messageId,
            content: request.content,
            imageUrl: request.imageUrl,
            categoryId: request.categoryId,
            userId: request.userId,
            startAt: request.startAt,
            endAt: request.endAt,
            verified: false, // Reset to unverified on update
            receiptText: null,
            receiptUrl: null,
        };
        return await this.adRepository.update(ad);
    }
}
exports.UpdateAd = UpdateAd;
