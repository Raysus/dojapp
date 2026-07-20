import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getStudentDetail,
  getStudentVisibleContents,
  assignStudentGrade,
  type VisibleContentsResponse,
} from '../services/students.service';
import type { Student } from '../types/student';
import StudentDetailSkeleton from '../components/StudentDetailSkeleton';
import { getAttendanceMetrics } from '../services/professor.service';
import { getDojoGrades } from '../services/dojos.service';
import { professorDojoPath } from '../platform/routes';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';

export default function StudentDetail() {
  const { dojoId, studentId } = useParams();
  const navigate = useNavigate();

  const goBack = () => {
    if (dojoId) navigate(professorDojoPath(dojoId));
    else navigate('/professor');
  };

  const [student, setStudent] = useState<Student | null>(null);
  const [visible, setVisible] = useState<VisibleContentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [attendanceMeta, setAttendanceMeta] = useState<{ attended: number; total: number } | null>(null);
  const [grades, setGrades] = useState<Array<{ id: string; name: string; order: number }>>([]);
  const [gradeId, setGradeId] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [missingGrade, setMissingGrade] = useState(false);

  const reloadVisible = useCallback(async () => {
    if (!dojoId || !studentId) return;
    try {
      const v = await getStudentVisibleContents(dojoId, studentId);
      setVisible(v);
      setGradeId(v.gradeId ?? '');
      setMissingGrade(false);
    } catch {
      setVisible(null);
      setMissingGrade(true);
    }
  }, [dojoId, studentId]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!dojoId || !studentId) return;

      try {
        setLoading(true);
        setLoadError(null);

        const [s, metrics, dojoGrades] = await Promise.all([
          getStudentDetail(dojoId, studentId),
          getAttendanceMetrics(dojoId),
          getDojoGrades(dojoId),
        ]);

        if (!mounted) return;

        setStudent(s as Student);
        setGrades(dojoGrades);

        const m = metrics.students.find(x => x.userId === studentId);
        setAttendancePct(m ? m.attendancePercentage : 0);
        setAttendanceMeta(
          m ? { attended: m.attendedClasses, total: m.totalClasses } : { attended: 0, total: metrics.totalClasses },
        );

        await reloadVisible();
      } catch (e) {
        console.error(e);
        if (mounted) setLoadError('No se pudo cargar el detalle del alumno.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [dojoId, studentId, reloadVisible]);

  const currentGradeLabel = useMemo(() => {
    const fallback = visible?.grade ?? '';
    const g = grades.find(x => x.id === gradeId);
    return g?.name ?? fallback;
  }, [grades, gradeId, visible?.grade]);

  const handleSaveGrade = async () => {
    if (!dojoId || !studentId || !gradeId) return;
    setSavingGrade(true);
    setGradeError(null);
    try {
      await assignStudentGrade(dojoId, studentId, gradeId);
      const s = await getStudentDetail(dojoId, studentId);
      setStudent(s as Student);
      await reloadVisible();
    } catch (e) {
      console.error(e);
      setGradeError('No se pudo guardar el grado');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) return <StudentDetailSkeleton />;

  if (loadError || !student) {
    return (
      <div className="stack">
        <div className="alert error">{loadError ?? 'Alumno no encontrado'}</div>
        <button className="button secondary" type="button" onClick={goBack}>
          ← Volver
        </button>
      </div>
    );
  }

  const canEditGrade = grades.length > 0;

  return (
    <div className="stack">
      <PageHeader
        title={student.name}
        subtitle={
          visible
            ? `${visible.dojoName} · ${currentGradeLabel}`
            : `${student.email} · Sin grado asignado en este dojo`
        }
        action={
          <button className="button secondary" type="button" onClick={goBack}>
            ← Volver
          </button>
        }
      />

      <div className="card">
        <div className="formGrid">
          <div>
            <div className="muted">Correo</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{student.email}</div>
          </div>
          <div>
            <div className="muted">Grado actual</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>
              {currentGradeLabel || 'Sin grado'}
            </div>
          </div>
        </div>
      </div>

      {missingGrade ? (
        <div className="alert error">
          Este alumno no tiene grado asignado. Selecciona uno abajo para desbloquear contenidos y métricas.
        </div>
      ) : null}

      <div className="stat-grid">
        <StatCard
          label="Asistencia"
          value={`${attendancePct ?? 0}%`}
          hint={
            attendanceMeta
              ? `${attendanceMeta.attended}/${attendanceMeta.total} clases`
              : 'Sin datos de asistencia'
          }
          accent="success"
        />
        <StatCard
          label="Contenidos visibles"
          value={visible?.contents?.length ?? 0}
          hint="Según grado actual"
        />
      </div>

      <div className="card">
        <h3>Editar grado del alumno</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          Cambiar el grado actualiza qué contenidos puede ver el alumno.
        </p>

        <div className="row" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <select
            className="input"
            style={{ maxWidth: 280 }}
            value={gradeId}
            onChange={e => setGradeId(e.target.value)}
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

          <button className="button" type="button" onClick={() => void handleSaveGrade()} disabled={!gradeId || savingGrade}>
            {savingGrade ? 'Guardando…' : 'Guardar grado'}
          </button>
        </div>

        {gradeError ? <p className="alert error" style={{ marginTop: 12 }}>{gradeError}</p> : null}
      </div>

      {visible?.contents?.length ? (
        <div className="card">
          <h3>Contenidos visibles</h3>
          <ul className="content-list" style={{ marginTop: 12 }}>
            {visible.contents.map(c => (
              <li key={c.id} className="content-item unlocked">
                <div className="content-listItem">
                  <div className="content-listItemMain">
                    <div className="content-listItemTitle">{c.title}</div>
                    <div className="content-listItemMeta">{c.type}</div>
                  </div>
                  <span className="content-typeBadge">{c.type}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
