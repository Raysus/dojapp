import { api } from '../api/axios'
import type { Student } from '../types/student'
import type { Content } from '../types/content'

export const getStudentsByDojo = async (dojoId: string) => {
  const res = await api.get(`/dojos/${dojoId}/students`)
  return res.data
}

export const getStudentDetail = async (
  dojoId: string,
  studentId: string
): Promise<Student> => {
  const res = await api.get<Student>(`/dojos/${dojoId}/students/${studentId}`)
  return res.data
}

export const toggleContent = async (
  dojoId: string,
  studentId: string,
  contentId: string
) => {
  const res = await api.post(
    `/dojos/${dojoId}/students/${studentId}/contents/toggle`,
    { contentId }
  )
  return res.data
}

export type StudentContentsByDojo = {
  dojoId: string
  dojoName: string
  grade: string
  contents: Content[]
}

export const getMyInfo = async () => {
  const res = await api.get(`/students/me`)
  return res.data
}

export const getMyContents = async (): Promise<StudentContentsByDojo[]> => {
  const res = await api.get<StudentContentsByDojo[]>(`/students/me/contents`)
  return res.data
}

export const completeMyContent = async (contentId: string) => {
  const res = await api.post(`/students/me/contents/${contentId}/complete`)
  return res.data
}

export type VisibleContentsResponse = {
  dojoId: string
  dojoName: string
  grade: string
  gradeId?: string
  contents: Content[]
}

export const getStudentVisibleContents = async (
  dojoId: string,
  studentId: string,
): Promise<VisibleContentsResponse> => {
  const res = await api.get<VisibleContentsResponse>(
    `/dojos/${dojoId}/students/${studentId}/contents`,
  )
  return res.data
}

export const getMyVisibleContents = async () => {
  const res = await api.get('/students/me/contents')
  return res.data
}

export const assignStudentGrade = async (
  dojoId: string,
  studentId: string,
  gradeId: string,
) => {
  const res = await api.patch(
    `/dojos/${dojoId}/students/${studentId}/grade`,
    { gradeId },
  )
  return res.data
}
