import type { Grade } from './grade';

export interface StudentContent {
  contentId: string;
  completed: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade?: Grade | null;
  studentContents: StudentContent[];
}
