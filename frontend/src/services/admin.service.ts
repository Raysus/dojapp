import { api } from '../api/axios';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  createdAt: string;
  dojoMemberships?: { dojoId: string; role: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR'; dojo?: { name: string } }[];
  studentGrades?: { dojoId: string; gradeId: string; grade?: { name: string; order: number } }[];
};

export type AdminStats = {
  users: number;
  dojos: number;
  contents: number;
  memberships: number;
  studentContents: number;
  completedStudentContents: number;
  attendances: number;
};

export type AdminDojo = { id: string; name: string; styleId: string };
export type AdminGrade = { id: string; name: string; order: number };

export async function getHealth() {
  const res = await api.get('/admin/health');
  return res.data as { ok: boolean; timestamp: string; uptimeSeconds: number };
}

export async function getStats() {
  const res = await api.get('/admin/stats');
  return res.data as AdminStats;
}

export async function listUsers() {
  const res = await api.get('/admin/users');
  return res.data as AdminUser[];
}

export async function createUser(body: {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  dojoId?: string;
  dojoRole?: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR';
  gradeId?: string;
}) {
  const res = await api.post('/admin/users', body);
  return res.data as AdminUser;
}

export async function assignUserToDojo(userId: string, body: {
  dojoId: string;
  dojoRole: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR';
  gradeId?: string;
}) {
  const res = await api.post(`/admin/users/${userId}/assign`, body);
  return res.data as { ok: true };
}

export async function listDojos() {
  const res = await api.get('/admin/dojos');
  return res.data as AdminDojo[];
}

export async function listGrades(dojoId: string) {
  const res = await api.get(`/admin/dojos/${dojoId}/grades`);
  return res.data as AdminGrade[];
}

export async function createContent(
  dojoId: string,
  body: {
    title: string;
    type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK';
    url?: string;
    body?: string;
    gradeId?: string;
  },
) {
  const res = await api.post(`/admin/dojos/${dojoId}/contents`, body);
  return res.data;
}
