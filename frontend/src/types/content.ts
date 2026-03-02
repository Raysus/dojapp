export type ContentType = 'PDF' | 'VIDEO' | 'TEXT' | 'LINK';

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  url?: string | null;
  body?: string | null;
  gradeId?: string | null;
  createdAt?: string; // ISO
}
