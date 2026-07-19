import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAttendanceMetrics, getDojoProgressMetrics } from '../services/professor.service';
import { professorDojoPath } from '../platform/routes';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import LoadingCard from '../components/ui/LoadingCard';

export default function DojoStats() {
  const { dojoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [p, a] = await Promise.all([
          getDojoProgressMetrics(dojoId!),
          getAttendanceMetrics(dojoId!),
        ]);
        if (!mounted) return;
        setProgress(p);
        setAttendance(a);
      } catch {
        if (!mounted) return;
        setError('No se pudieron cargar las estadísticas del dojo.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (dojoId) void load();
    return () => {
      mounted = false;
    };
  }, [dojoId]);

  const summary = useMemo(() => {
    const students = progress.length;
    const avgProgress = students
      ? Math.round(progress.reduce((acc, s) => acc + (s.percentage ?? 0), 0) / students)
      : 0;
    const totalCompleted = progress.reduce((acc, s) => acc + (s.completed ?? 0), 0);
    const totalItems = progress.reduce((acc, s) => acc + (s.total ?? 0), 0);
    return { students, avgProgress, totalCompleted, totalItems };
  }, [progress]);

  if (loading) {
    return (
      <div className="stack">
        <PageHeader title="Estadísticas del dojo" subtitle="Resumen de progreso y asistencia." />
        <LoadingCard message="Cargando métricas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stack">
        <PageHeader
          title="Estadísticas del dojo"
          action={
            <Link className="link" to={dojoId ? professorDojoPath(dojoId) : '/professor'}>
              ← Volver
            </Link>
          }
        />
        <div className="alert error">{error}</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title="Estadísticas del dojo"
        subtitle="Progreso de contenidos y asistencia por alumno."
        action={
          <Link className="link" to={dojoId ? professorDojoPath(dojoId) : '/professor'}>
            ← Volver
          </Link>
        }
      />

      <div className="stat-grid">
        <StatCard label="Alumnos" value={summary.students} />
        <StatCard label="Progreso promedio" value={`${summary.avgProgress}%`} accent="success" />
        <StatCard label="Completados" value={summary.totalCompleted} hint={`de ${summary.totalItems} items`} />
        <StatCard
          label="Asistencia promedio"
          value={`${attendance?.avgAttendancePercentage ?? 0}%`}
          hint={`${attendance?.totalClasses ?? 0} clases registradas`}
        />
      </div>

      <div className="card">
        <h3>Detalle por alumno</h3>
        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Grado</th>
                <th>Progreso</th>
                <th>Completado</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {progress.map(s => {
                const att = attendance?.students?.find((x: { userId: string }) => x.userId === s.userId);
                return (
                  <tr key={s.userId}>
                    <td>{s.name}</td>
                    <td>{s.grade ?? '—'}</td>
                    <td>{s.percentage ?? 0}%</td>
                    <td>
                      {s.completed ?? 0}/{s.total ?? 0}
                    </td>
                    <td>{att ? `${att.attendancePercentage}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
