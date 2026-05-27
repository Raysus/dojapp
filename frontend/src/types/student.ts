import type { Grade } from './grade';

export interface StudentContent {
  contentId: string;
  completed: boolean;
  // backend puede incluir { content } opcionalmente, pero no lo requerimos aquí
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade?: Grade | null;
  studentContents: StudentContent[];
}
