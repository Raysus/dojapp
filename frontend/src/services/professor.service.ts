import { api } from '../api/axios';

export type DojoProgressMetric = {
  userId: string;
  name: string;
  grade: string | null;
  completed: number;
  total: number;
  percentage: number;
  lastActivity: string | null;
};

export type AttendanceMetrics = {
  dojoId: string;
  dojoName: string;
  totalClasses: number;
  avgAttendancePercentage: number;
  students: Array<{
    userId: string;
    userName: string;
    dojoId: string;
    dojoName: string;
    totalClasses: number;
    attendedClasses: number;
    attendancePercentage: number;
  }>;
};

export type AttendanceForDate = Array<{
  userId: string;
  name: string;
  date: string;
  present: boolean;
}>;

export async function getDojoProgressMetrics(dojoId: string) {
  const res = await api.get(`/metrics/dojos/${dojoId}/metrics`);
  return res.data as DojoProgressMetric[];
}

export async function getAttendanceMetrics(dojoId: string) {
  const res = await api.get(`/dojos/${dojoId}/attendance/metrics`);
  return res.data as AttendanceMetrics;
}

export async function getAttendanceForDate(dojoId: string, dateISO?: string) {
  const res = await api.get(`/dojos/${dojoId}/attendance`, {
    params: dateISO ? { date: dateISO } : undefined,
  });
  return res.data as AttendanceForDate;
}

export async function markAttendance(
  dojoId: string,
  items: Array<{ userId: string; present: boolean; date?: string }>,
) {
  const res = await api.post(`/dojos/${dojoId}/attendance`, items);
  return res.data;
}
