import { Ad } from "../../domain/entities/Ad";
import { AdRepository } from "../../domain/repositories/AdRepository";

interface UpdateAdRequest {
    id: number; // Ad ID to update
  messageId: number ; // Telegram message ID, optional at creation
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

export class UpdateAd {
  constructor(private adRepository: AdRepository) {}

  async execute(request: UpdateAdRequest): Promise<Ad> {
    console.log("Updating ad:", request);
    // Basic validation
    if (!request.content) {
      throw new Error("Ad content is required");
    }
    if (request.startAt >= request.endAt) {
      throw new Error("Start date must be before end date");
    }
    //if (!request.messageId) {
      //throw new Error("Ad MessageID is required for update");
    //}

    const ad: Ad = {
        id: request.id, // Use messageId as the unique identifier for update
      messageId: request.messageId, 
      content: request.content,
      imageUrl: request.imageUrl,
      categoryId: request.categoryId,
      userId: request.userId,
      startAt: request.startAt,
      endAt: request.endAt,
      verified: request.verified, 
      receiptText: request.receiptText,
      receiptUrl: request.receiptUrl,

    };
    
    return await this.adRepository.update(ad);
  }
}
