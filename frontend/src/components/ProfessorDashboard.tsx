import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDojos, getDojoGrades, getDojoContents } from '../services/dojos.service';
import { getStudentsByDojo } from '../services/students.service';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import LoadingCard from './ui/LoadingCard';
import { IconDojo, IconUser } from './icons';

type Grade = { id: string; name: string; order: number };
type Content = { id: string; title: string; type: string; gradeId: string | null };
type Dojo = { id: string; name: string };

export default function ProfessorDashboard() {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loadingDojos, setLoadingDojos] = useState(true);
  const [loadingDojoData, setLoadingDojoData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyDojos()
      .then(setDojos)
      .finally(() => setLoadingDojos(false));
  }, []);

  const loadDojo = async (dojoId: string) => {
    setSelectedDojo(dojoId);
    setLoadingDojoData(true);
    try {
      const [studentsRes, gradesRes, contentsRes] = await Promise.all([
        getStudentsByDojo(dojoId),
        getDojoGrades(dojoId),
        getDojoContents(dojoId),
      ]);
      setStudents(studentsRes ?? []);
      setGrades(gradesRes ?? []);
      setContents(contentsRes ?? []);
    } finally {
      setLoadingDojoData(false);
    }
  };

  const groupedContents = useMemo(() => {
    const globals = (contents ?? []).filter(c => !c.gradeId);
    const byGrade = (grades ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(g => ({
        grade: g,
        items: (contents ?? []).filter(c => c.gradeId === g.id),
      }))
      .filter(group => group.items.length > 0);

    return { globals, byGrade };
  }, [contents, grades]);

  if (loadingDojos) return <LoadingCard message="Cargando dojos…" />;

  return (
    <div className="stack">
      <PageHeader
        title="Panel del profesor"
        subtitle="Gestiona alumnos, contenidos y accesos rápidos por dojo."
      />

      {dojos.length === 0 ? (
        <EmptyState
          icon={<IconDojo />}
          title="No tienes dojos asignados"
          description="Pide a un administrador que te asigne a un dojo como profesor o instructor."
        />
      ) : (
        dojos.map(dojo => (
          <div
            key={dojo.id}
            className={`card dojo-card ${selectedDojo === dojo.id ? 'selected' : ''}`}
          >
            <div className="dojo-cardHeader">
              <div className="dojo-cardTitle">
                <span className="dojo-cardIcon" aria-hidden="true">
                  <IconDojo />
                </span>
                <h3>{dojo.name}</h3>
              </div>
              <button
                className={`button ${selectedDojo === dojo.id ? 'ghost' : 'secondary'}`}
                type="button"
                onClick={() => void loadDojo(dojo.id)}
              >
                {selectedDojo === dojo.id ? 'Actualizar' : 'Abrir dojo'}
              </button>
            </div>
          </div>
        ))
      )}

      {selectedDojo ? (
        <>
          <div className="card">
            <div className="dojo-cardHeader">
              <div>
                <h3>Acciones rápidas</h3>
                <p className="muted">Herramientas del dojo seleccionado</p>
              </div>
              <div className="actionBar">
                <button
                  className="button"
                  type="button"
                  onClick={() => navigate(`/dojos/${selectedDojo}/stats`)}
                  disabled={loadingDojoData}
                >
                  Estadísticas
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => navigate(`/dojos/${selectedDojo}/attendance`)}
                  disabled={loadingDojoData}
                >
                  Asistencia
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Alumnos</h3>
              {loadingDojoData ? (
                <LoadingCard message="Cargando alumnos…" />
              ) : students.length === 0 ? (
                <p className="muted">No hay alumnos en este dojo.</p>
              ) : (
                <ul className="content-list" style={{ marginTop: 12 }}>
                  {students.map(student => (
                    <li key={student.id}>
                      <button
                        type="button"
                        className="listAction"
                        onClick={() =>
                          navigate(`/dojos/${selectedDojo}/students/${student.id}`)
                        }
                      >
                        <span aria-hidden="true">
                          <IconUser />
                        </span>{' '}
                        {student?.name ?? student?.user?.name ?? 'Alumno'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h3>Contenidos del dojo</h3>
              <p className="muted">Globales primero, luego por grado.</p>

              {loadingDojoData ? (
                <LoadingCard message="Cargando contenidos…" />
              ) : (
                <>
                  <div style={{ marginTop: 14 }}>
                    <div className="pill" style={{ marginBottom: 10 }}>
                      Globales
                    </div>
                    {groupedContents.globals.length === 0 ? (
                      <p className="muted">No hay contenidos globales.</p>
                    ) : (
                      <ul className="content-list">
                        {groupedContents.globals.map(c => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="listAction"
                              onClick={() =>
                                navigate(`/dojos/${selectedDojo}/contents/${c.id}`)
                              }
                            >
                              <span className="content-listItem">
                                <span className="content-listItemMain">
                                  <span className="content-listItemTitle">{c.title}</span>
                                  <span className="content-listItemMeta">{c.type} • Global</span>
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div className="pill" style={{ marginBottom: 10 }}>
                      Por grado
                    </div>
                    {groupedContents.byGrade.length === 0 ? (
                      <p className="muted">No hay contenidos por grado.</p>
                    ) : (
                      groupedContents.byGrade.map(group => (
                        <div key={group.grade.id} style={{ marginBottom: 14 }}>
                          <h4 style={{ marginBottom: 8 }}>
                            {group.grade.order}. {group.grade.name}
                          </h4>
                          <ul className="content-list">
                            {group.items.map(c => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  className="listAction"
                                  onClick={() =>
                                    navigate(`/dojos/${selectedDojo}/contents/${c.id}`)
                                  }
                                >
                                  <span className="content-listItem">
                                    <span className="content-listItemMain">
                                      <span className="content-listItemTitle">{c.title}</span>
                                      <span className="content-listItemMeta">{c.type}</span>
                                    </span>
                                  </span>
                                </button>
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
      ) : null}
    </div>
  );
}
