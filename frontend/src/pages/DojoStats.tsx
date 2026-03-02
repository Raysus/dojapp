import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAttendanceMetrics, getDojoProgressMetrics } from '../services/professor.service';

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
      } catch (e) {
        if (!mounted) return;
        setError('No se pudieron cargar las estadísticas del dojo.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (dojoId) load();
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
      <div>
        <h2>📊 Estadísticas</h2>
        <p>Cargando…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>📊 Estadísticas</h2>
        <p className="alert error">{error}</p>
        <Link className="link" to="/professor">← Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>📊 Estadísticas</h2>
      <Link className="link" to="/professor">← Volver</Link>

      <div className="divider" />

      <div className="grid">
        <div className="stat">
          <div className="muted">Alumnos</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.students}</div>
        </div>
        <div className="stat">
          <div className="muted">Progreso promedio</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.avgProgress}%</div>
        </div>
        <div className="stat">
          <div className="muted">Completados (total)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.totalCompleted}</div>
        </div>
        <div className="stat">
          <div className="muted">Items (total)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.totalItems}</div>
        </div>

        <div className="stat full">
          <div className="muted">Asistencia promedio</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {attendance?.avgAttendancePercentage ?? 0}%
          </div>
          <div className="muted">
            Clases registradas: {attendance?.totalClasses ?? 0}
          </div>
        </div>
      </div>

      <div className="divider" />

      <h3>Detalle por alumno</h3>

      <div className="tableWrap">
        <table className="table">
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
            {progress.map((s) => {
              const att = attendance?.students?.find((x: any) => x.userId === s.userId);
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
  );
}
