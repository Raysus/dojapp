import { api } from '../api/axios';

export const getMyDojos = async () => {
  const res = await api.get('/dojos/mine');
  return res.data;
};

export const getDojoGrades = async (dojoId: string) => {
  const res = await api.get(`/dojos/${dojoId}/grades`);
  return res.data as Array<{ id: string; name: string; order: number }>;
};

export const getDojoContents = async (dojoId: string) =>
  (await api.get(`/dojos/${dojoId}/contents`)).data;

export type CreateDojoContentInput = {
  title: string;
  type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK';
  url?: string;
  body?: string;
  gradeId?: string;
};

export const createDojoContent = async (dojoId: string, data: CreateDojoContentInput) => {
  const res = await api.post(`/dojos/${dojoId}/contents`, data);
  return res.data;
};