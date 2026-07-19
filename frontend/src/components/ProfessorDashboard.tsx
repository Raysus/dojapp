import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createDojoContent,
  getMyDojos,
  getDojoGrades,
  getDojoContents,
} from '../services/dojos.service';
import { addStudentToDojo, getStudentsByDojo } from '../services/students.service';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import { professorDojoPath } from '../platform/routes';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import LoadingCard from './ui/LoadingCard';
import { IconDojo, IconUser } from './icons';

type Grade = { id: string; name: string; order: number };
type Content = { id: string; title: string; type: string; gradeId: string | null };
type Dojo = { id: string; name: string };

const emptyStudentForm = {
  name: '',
  email: '',
  password: '',
  gradeId: '',
};

const emptyContentForm = {
  title: '',
  type: 'TEXT' as 'PDF' | 'VIDEO' | 'TEXT' | 'LINK',
  url: '',
  body: '',
  gradeId: '',
};

export default function ProfessorDashboard() {
  const { dojoId: routeDojoId } = useParams<{ dojoId?: string }>();
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loadingDojos, setLoadingDojos] = useState(true);
  const [loadingDojoData, setLoadingDojoData] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedDojo = routeDojoId ?? null;
  const selectedDojoName = dojos.find(d => d.id === selectedDojo)?.name;

  useEffect(() => {
    getMyDojos()
      .then(setDojos)
      .finally(() => setLoadingDojos(false));
  }, []);

  useEffect(() => {
    if (!selectedDojo) {
      setStudents([]);
      setGrades([]);
      setContents([]);
      setShowAddStudent(false);
      setShowAddContent(false);
      setFormError(null);
      setFormSuccess(null);
      return;
    }

    let mounted = true;
    async function load() {
      setLoadingDojoData(true);
      setFormError(null);
      try {
        const [studentsRes, gradesRes, contentsRes] = await Promise.all([
          getStudentsByDojo(selectedDojo!),
          getDojoGrades(selectedDojo!),
          getDojoContents(selectedDojo!),
        ]);
        if (!mounted) return;
        setStudents(studentsRes ?? []);
        setGrades(gradesRes ?? []);
        setContents(contentsRes ?? []);
        setStudentForm(prev => ({
          ...prev,
          gradeId: prev.gradeId || gradesRes?.[0]?.id || '',
        }));
      } catch (e) {
        if (!mounted) return;
        setFormError(
          getNetworkErrorMessage(e) ?? 'No se pudo cargar la información del dojo.',
        );
      } finally {
        if (mounted) setLoadingDojoData(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [selectedDojo]);

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

  const openDojo = (dojoId: string) => {
    navigate(professorDojoPath(dojoId));
  };

  const refreshDojo = async () => {
    if (!selectedDojo) return;
    setLoadingDojoData(true);
    try {
      const [studentsRes, gradesRes, contentsRes] = await Promise.all([
        getStudentsByDojo(selectedDojo),
        getDojoGrades(selectedDojo),
        getDojoContents(selectedDojo),
      ]);
      setStudents(studentsRes ?? []);
      setGrades(gradesRes ?? []);
      setContents(contentsRes ?? []);
    } finally {
      setLoadingDojoData(false);
    }
  };

  const onAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDojo || !studentForm.gradeId) return;

    setSavingStudent(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await addStudentToDojo(selectedDojo, {
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        password: studentForm.password || undefined,
        gradeId: studentForm.gradeId,
      });
      setStudentForm({
        ...emptyStudentForm,
        gradeId: grades[0]?.id ?? '',
      });
      setShowAddStudent(false);
      setFormSuccess('Alumno agregado al dojo.');
      await refreshDojo();
    } catch (err: any) {
      setFormError(
        getNetworkErrorMessage(err) ??
          err?.response?.data?.message ??
          'No se pudo agregar el alumno.',
      );
    } finally {
      setSavingStudent(false);
    }
  };

  const onAddContent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDojo) return;

    if (
      (contentForm.type === 'LINK' ||
        contentForm.type === 'PDF' ||
        contentForm.type === 'VIDEO') &&
      !contentForm.url.trim()
    ) {
      setFormError(`La URL es obligatoria para contenidos de tipo ${contentForm.type}.`);
      setFormSuccess(null);
      return;
    }

    setSavingContent(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await createDojoContent(selectedDojo, {
        title: contentForm.title.trim(),
        type: contentForm.type,
        url: contentForm.url.trim() || undefined,
        body: contentForm.body.trim() || undefined,
        gradeId: contentForm.gradeId || undefined,
      });
      setContentForm(emptyContentForm);
      setShowAddContent(false);
      setFormSuccess('Contenido creado correctamente.');
      await refreshDojo();
    } catch (err: any) {
      setFormError(
        getNetworkErrorMessage(err) ??
          err?.response?.data?.message ??
          'No se pudo crear el contenido.',
      );
    } finally {
      setSavingContent(false);
    }
  };

  if (loadingDojos) return <LoadingCard message="Cargando dojos…" />;

  return (
    <div className="stack">
      <PageHeader
        title={selectedDojoName ? selectedDojoName : 'Panel del profesor'}
        subtitle={
          selectedDojo
            ? 'Gestiona alumnos, contenidos y accesos rápidos de este dojo.'
            : 'Selecciona un dojo para gestionar alumnos y contenidos.'
        }
        action={
          selectedDojo ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate('/professor')}
            >
              ← Mis dojos
            </button>
          ) : undefined
        }
      />

      {formError ? <div className="alert error">{formError}</div> : null}
      {formSuccess ? <div className="alert success">{formSuccess}</div> : null}

      {!selectedDojo ? (
        dojos.length === 0 ? (
          <EmptyState
            icon={<IconDojo />}
            title="No tienes dojos asignados"
            description="Pide a un administrador que te asigne a un dojo como profesor o instructor."
          />
        ) : (
          dojos.map(dojo => (
            <div key={dojo.id} className="card dojo-card">
              <div className="dojo-cardHeader">
                <div className="dojo-cardTitle">
                  <span className="dojo-cardIcon" aria-hidden="true">
                    <IconDojo />
                  </span>
                  <h3>{dojo.name}</h3>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => openDojo(dojo.id)}
                >
                  Abrir dojo
                </button>
              </div>
            </div>
          ))
        )
      ) : (
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
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => void refreshDojo()}
                  disabled={loadingDojoData}
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="dojo-cardHeader">
                <h3>Alumnos</h3>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setShowAddStudent(v => !v);
                    setShowAddContent(false);
                    setFormError(null);
                  }}
                  disabled={loadingDojoData || grades.length === 0}
                >
                  {showAddStudent ? 'Cancelar' : '+ Alumno'}
                </button>
              </div>

              {showAddStudent ? (
                <form className="form" onSubmit={e => void onAddStudent(e)} style={{ marginTop: 12 }}>
                  <div className="formGrid">
                    <label className="fieldLabel">
                      Nombre
                      <input
                        className="input"
                        value={studentForm.name}
                        onChange={e =>
                          setStudentForm({ ...studentForm, name: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label className="fieldLabel">
                      Email
                      <input
                        className="input"
                        type="email"
                        value={studentForm.email}
                        onChange={e =>
                          setStudentForm({ ...studentForm, email: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label className="fieldLabel">
                      Contraseña (nueva cuenta)
                      <input
                        className="input"
                        type="password"
                        minLength={6}
                        value={studentForm.password}
                        onChange={e =>
                          setStudentForm({ ...studentForm, password: e.target.value })
                        }
                        placeholder="Obligatoria si el email es nuevo"
                      />
                    </label>
                    <label className="fieldLabel">
                      Grado
                      <select
                        className="input"
                        value={studentForm.gradeId}
                        onChange={e =>
                          setStudentForm({ ...studentForm, gradeId: e.target.value })
                        }
                        required
                      >
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.order}. {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button
                    className="button"
                    type="submit"
                    disabled={savingStudent}
                    style={{ marginTop: 12 }}
                  >
                    {savingStudent ? 'Guardando…' : 'Agregar alumno'}
                  </button>
                </form>
              ) : null}

              {loadingDojoData ? (
                <LoadingCard message="Cargando alumnos…" />
              ) : students.length === 0 ? (
                <EmptyState
                  icon={<IconUser />}
                  title="Sin alumnos"
                  description="Agrega el primer alumno de este dojo con el botón + Alumno."
                />
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
              <div className="dojo-cardHeader">
                <div>
                  <h3>Contenidos del dojo</h3>
                  <p className="muted">Globales primero, luego por grado.</p>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setShowAddContent(v => !v);
                    setShowAddStudent(false);
                    setFormError(null);
                  }}
                  disabled={loadingDojoData}
                >
                  {showAddContent ? 'Cancelar' : '+ Contenido'}
                </button>
              </div>

              {showAddContent ? (
                <form className="form" onSubmit={e => void onAddContent(e)} style={{ marginTop: 12 }}>
                  <div className="formGrid">
                    <label className="fieldLabel">
                      Título
                      <input
                        className="input"
                        value={contentForm.title}
                        onChange={e =>
                          setContentForm({ ...contentForm, title: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label className="fieldLabel">
                      Tipo
                      <select
                        className="input"
                        value={contentForm.type}
                        onChange={e =>
                          setContentForm({
                            ...contentForm,
                            type: e.target.value as typeof contentForm.type,
                          })
                        }
                      >
                        <option value="TEXT">Texto</option>
                        <option value="LINK">Enlace</option>
                        <option value="PDF">PDF</option>
                        <option value="VIDEO">Video</option>
                      </select>
                    </label>
                    <label className="fieldLabel">
                      Grado (opcional)
                      <select
                        className="input"
                        value={contentForm.gradeId}
                        onChange={e =>
                          setContentForm({ ...contentForm, gradeId: e.target.value })
                        }
                      >
                        <option value="">Global</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.order}. {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="fieldLabel">
                      URL{' '}
                      {contentForm.type === 'TEXT' ? '(opcional)' : '(obligatoria)'}
                      <input
                        className="input"
                        value={contentForm.url}
                        onChange={e =>
                          setContentForm({ ...contentForm, url: e.target.value })
                        }
                      />
                    </label>
                    <label className="fieldLabel" style={{ gridColumn: '1 / -1' }}>
                      Texto (opcional)
                      <textarea
                        className="input"
                        value={contentForm.body}
                        onChange={e =>
                          setContentForm({ ...contentForm, body: e.target.value })
                        }
                        rows={3}
                      />
                    </label>
                  </div>
                  <button
                    className="button"
                    type="submit"
                    disabled={savingContent}
                    style={{ marginTop: 12 }}
                  >
                    {savingContent ? 'Creando…' : 'Crear contenido'}
                  </button>
                </form>
              ) : null}

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
                                  <span className="content-listItemMeta">
                                    {c.type} • Global
                                  </span>
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
      )}
    </div>
  );
}
