import type { User } from './user';
import type { Grade } from './grade';

export interface StudentContent {
  contentId: string;
}

export interface Student {
  id: string;
  user: User;
  grade: Grade;
  studentContents: StudentContent[];
}
