import { api } from '../api/axios';
import type { AuthTokens } from './auth.service';

export type ProfileDojo = {
  id: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR';
  grade: { id: string; name: string; order: number } | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  createdAt: string;
  dojos: ProfileDojo[];
};

export type UpdateProfileResult = AuthTokens & {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
};

export const getMyProfile = async (): Promise<UserProfile> => {
  const res = await api.get<UserProfile>('/users/me');
  return res.data;
};

export const updateMyProfile = async (body: {
  name?: string;
  email?: string;
}): Promise<UpdateProfileResult> => {
  const res = await api.patch<UpdateProfileResult>('/users/me', body);
  return res.data;
};

export const changeMyPassword = async (body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> => {
  const res = await api.post<{ ok: boolean }>('/users/me/password', body);
  return res.data;
};

export const logoutOtherSessions = async (): Promise<AuthTokens & { ok: boolean }> => {
  const res = await api.post<AuthTokens & { ok: boolean }>('/users/me/logout-others');
  return res.data;
};
