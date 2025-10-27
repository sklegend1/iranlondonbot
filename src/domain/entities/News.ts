export interface News {
    id?: number;
    title: string;
    link: string;
    content: string;
    image?: string | null;
    source: string;
    createdAt: Date;
    publishedAt: Date;
    posted?: boolean;
  }
  