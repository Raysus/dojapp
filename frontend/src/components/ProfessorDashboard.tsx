import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyDojos, getDojoGrades, getDojoContents } from '../services/dojos.service'
import { getStudentsByDojo } from '../services/students.service'

type Grade = { id: string; name: string; order: number }
type Content = { id: string; title: string; type: string; gradeId: string | null }

export default function ProfessorDashboard() {
  const [dojos, setDojos] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedDojo, setSelectedDojo] = useState<string | null>(null)

  const [grades, setGrades] = useState<Grade[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [loadingDojoData, setLoadingDojoData] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    getMyDojos().then(setDojos)
  }, [])

  const loadDojo = async (dojoId: string) => {
    setSelectedDojo(dojoId)
    setLoadingDojoData(true)
    try {
      const [studentsRes, gradesRes, contentsRes] = await Promise.all([
        getStudentsByDojo(dojoId),
        getDojoGrades(dojoId),
        getDojoContents(dojoId),
      ])
      setStudents(studentsRes ?? [])
      setGrades(gradesRes ?? [])
      setContents(contentsRes ?? [])
    } finally {
      setLoadingDojoData(false)
    }
  }

  const groupedContents = useMemo(() => {
    const globals = (contents ?? []).filter(c => !c.gradeId)

    const byGrade = (grades ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(g => ({
        grade: g,
        items: (contents ?? []).filter(c => c.gradeId === g.id),
      }))
      .filter(group => group.items.length > 0)

    return { globals, byGrade }
  }, [contents, grades])

  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Mis Dojos</h2>
      </div>

      {dojos.map(dojo => (
        <div key={dojo.id} className={`card dojo-card ${selectedDojo === dojo.id ? 'selected' : ''}`}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>🥋 {dojo.name}</h3>

            <button className="button secondary" onClick={() => loadDojo(dojo.id)}>
              {selectedDojo === dojo.id ? 'Actualizar' : 'Ver dojo'}
            </button>
          </div>
        </div>
      ))}

      {selectedDojo && (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Panel del Dojo</h3>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  Accesos rápidos y resumen de contenidos
                </p>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="button"
                  onClick={() => navigate(`/dojos/${selectedDojo}/stats`)}
                  disabled={loadingDojoData}
                >
                  📊 Estadísticas
                </button>
                <button
                  className="button"
                  onClick={() => navigate(`/dojos/${selectedDojo}/attendance`)}
                  disabled={loadingDojoData}
                >
                  ✅ Asistencia
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Alumnos</h3>
              {loadingDojoData && <p className="muted">Cargando…</p>}
              {!loadingDojoData && students.length === 0 && <p>No hay alumnos</p>}

              <ul style={{ marginTop: 12 }}>
                {students.map(student => (
                  <li
                    key={student.id}
                    className="student-item"
                    onClick={() => navigate(`/dojos/${selectedDojo}/students/${student.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/dojos/${selectedDojo}/students/${student.id}`)
                      }
                    }}
                  >
                    👤 {student?.name ?? student?.user?.name ?? 'Alumno'}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Contenidos del dojo</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Primero globales, luego por grado (ordenado).
              </p>

              {loadingDojoData && <p className="muted">Cargando…</p>}

              {!loadingDojoData && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                      Globales
                    </div>

                    {groupedContents.globals.length === 0 ? (
                      <p className="muted" style={{ margin: 0 }}>No hay contenidos globales.</p>
                    ) : (
                      <ul>
                        {groupedContents.globals.map(c => (
                          <li key={c.id} className="content-item unlocked">
                            <b>{c.title}</b>
                            <div className="muted" style={{ fontSize: 12 }}>{c.type} • Global</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                      Por grado
                    </div>

                    {groupedContents.byGrade.length === 0 ? (
                      <p className="muted" style={{ margin: 0 }}>No hay contenidos por grado.</p>
                    ) : (
                      groupedContents.byGrade.map(group => (
                        <div key={group.grade.id} style={{ marginBottom: 14 }}>
                          <div style={{ fontWeight: 600 }}>
                            {group.grade.order}. {group.grade.name}
                          </div>
                          <ul style={{ marginTop: 8 }}>
                            {group.items.map(c => (
                              <li
                                key={c.id}
                                className="content-item unlocked"
                                onClick={() => navigate(`/dojos/${selectedDojo}/contents/${c.id}`)}
                                role="button"
                                tabIndex={0}
                              >
                                <b>{c.title}</b>
                                <div className="muted" style={{ fontSize: 12 }}>{c.type}{c.gradeId ? '' : ' • Global'}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}