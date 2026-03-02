export type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}
