export interface Ad {
    id?: number;
    messageId: number | null; // Telegram message ID
    content: string;
    imageUrl: string | null; // optional image for ad
    categoryId: number;
    userId: number;
    startAt: Date;
    endAt: Date;
    verified: boolean;
    receiptUrl: string | null;  // optional field for payment receipt
  receiptText: string | null; // optional field for payment receipt text
    createdAt?: Date;
  }