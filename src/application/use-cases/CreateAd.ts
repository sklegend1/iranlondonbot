import { Ad } from "../../domain/entities/Ad";
import { AdRepository } from "../../domain/repositories/AdRepository";

export interface CreateAdRequest {
  messageId: number | null; // Telegram message ID, optional at creation
  content: string;
  imageUrl: string | null;
  categoryId: number;
  userId: number;
  startAt: Date;
  endAt: Date;
  verified: boolean;
        receiptText: string | null;
        receiptUrl: string | null;
}

export class CreateAd {
  constructor(private adRepository: AdRepository) {}

  async execute(request: CreateAdRequest): Promise<Ad> {
    // Basic validation
    if (!request.content) {
      throw new Error("Ad content is required");
    }
    if (request.startAt >= request.endAt) {
      throw new Error("Start date must be before end date");
    }

    const ad: Ad = {
      messageId: null, // Will be set after posting to Telegram
      content: request.content,
      imageUrl: request.imageUrl,
      categoryId: request.categoryId,
      userId: request.userId,
      startAt: request.startAt,
      endAt: request.endAt,
      verified: request.verified? true:false ,
        receiptText: request.receiptText? request.receiptText : null,
        receiptUrl: request.receiptUrl? request.receiptUrl : null,
    };

    return await this.adRepository.create(ad);
  }
}
