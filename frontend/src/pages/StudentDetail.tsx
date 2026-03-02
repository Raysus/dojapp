import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getStudentDetail,
  getStudentVisibleContents,
  assignStudentGrade,
  type VisibleContentsResponse,
} from '../services/students.service'
import type { Student } from '../types/student'
import StudentDetailSkeleton from '../components/StudentDetailSkeleton'
import { getAttendanceMetrics } from '../services/professor.service'
import { getDojoGrades } from '../services/dojos.service'

export default function StudentDetail() {
  const { dojoId, studentId } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [visible, setVisible] = useState<VisibleContentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendancePct, setAttendancePct] = useState<number | null>(null)
  const [attendanceMeta, setAttendanceMeta] = useState<{ attended: number; total: number } | null>(null)
  const [grades, setGrades] = useState<Array<{ id: string; name: string; order: number }>>([])
  const [gradeId, setGradeId] = useState<string>('')
  const [savingGrade, setSavingGrade] = useState(false)
  const [gradeError, setGradeError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!dojoId || !studentId) return
        setLoading(true)

        const [s, v, metrics, dojoGrades] = await Promise.all([
          getStudentDetail(dojoId, studentId),
          getStudentVisibleContents(dojoId, studentId),
          getAttendanceMetrics(dojoId),
          getDojoGrades(dojoId),
        ])

        if (!mounted) return
        setStudent(s as any)
        setVisible(v)

        const m = metrics.students.find(x => x.userId === studentId)
        setAttendancePct(m ? m.attendancePercentage : 0)
        setAttendanceMeta(m ? { attended: m.attendedClasses, total: m.totalClasses } : { attended: 0, total: metrics.totalClasses })

        setGrades(dojoGrades)
        setGradeId((v as any).gradeId ?? '')
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [dojoId, studentId])

  const currentGradeLabel = useMemo(() => {
    const fallback = visible?.grade ?? ''
    const g = grades.find(x => x.id === gradeId)
    return g?.name ?? fallback
  }, [grades, gradeId, visible?.grade])

  if (loading || !student || !visible) return <StudentDetailSkeleton />

  const canEditGrade = grades.length > 0

  const handleSaveGrade = async () => {
    if (!dojoId || !studentId || !gradeId) return
    setSavingGrade(true)
    setGradeError(null)
    try {
      await assignStudentGrade(dojoId, studentId, gradeId)
      const [s, v] = await Promise.all([
        getStudentDetail(dojoId, studentId),
        getStudentVisibleContents(dojoId, studentId),
      ])
      setStudent(s as any)
      setVisible(v)
    } catch (e: any) {
      console.error(e)
      setGradeError('No se pudo guardar el grado')
    } finally {
      setSavingGrade(false)
    }
  }

  return (
    <div className="stack">

      <button className="button secondary" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>
        ← Volver
      </button>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{student.name}</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          {visible.dojoName} • {currentGradeLabel}
        </p>

        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Asistencia</div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${attendancePct ?? 0}%` }} />
          </div>
          <p style={{ margin: '8px 0 0' }}>
            <strong>{attendancePct ?? 0}%</strong>
            {attendanceMeta ? (
              <span className="muted"> • {attendanceMeta.attended}/{attendanceMeta.total} clases</span>
            ) : null}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Editar grado del alumno</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="input"
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              disabled={!canEditGrade || savingGrade}
            >
              <option value="" disabled>
                Selecciona un grado
              </option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>
                  {g.order}. {g.name}
                </option>
              ))}
            </select>

            <button
              className="button"
              onClick={handleSaveGrade}
              disabled={!gradeId || savingGrade}
            >
              {savingGrade ? 'Guardando…' : 'Guardar grado'}
            </button>
          </div>
          {gradeError ? (
            <p className="muted" style={{ color: 'var(--danger)', marginTop: 8 }}>{gradeError}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
