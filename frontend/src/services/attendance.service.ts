import { api } from '../api/axios'

export type AttendanceRecord = { userId: string; present: boolean }

export const getAttendance = async (dojoId: string, date: string) => {
    const res = await api.get(`/dojos/${dojoId}/attendance`, { params: { date } })
    return res.data as AttendanceRecord[]
}

export const saveAttendance = async (dojoId: string, date: string, records: AttendanceRecord[]) => {
    const payload = records.map(r => ({ userId: r.userId, present: r.present, date }))
    const res = await api.post(`/dojos/${dojoId}/attendance`, payload)
    return res.data
}