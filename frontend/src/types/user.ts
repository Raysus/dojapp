export type Role = 'PROFESSOR' | 'STUDENT';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
}
