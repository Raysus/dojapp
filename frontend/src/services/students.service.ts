import { api } from '../api/axios';
import type { Student } from '../types/student';

export const getStudentsByDojo = async (dojoId: string) => {
    const res = await api.get(`/dojos/${dojoId}/students`);
    return res.data;
};

export const getStudentById = async (id: string) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
};

export const getStudentDetail = async (id: string): Promise<Student> => {
  const res = await api.get<Student>(`/students/${id}`);
  return res.data;
};

export const toggleContent = async (studentId: string, contentId: string) => {
    const res = await api.post(`/students/${studentId}/toggle`, { contentId });
    return res.data;
};

