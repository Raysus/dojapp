import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudentsByDojo } from '../services/students.service';
import { getAttendance, saveAttendance } from '../services/attendance.service';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import LoadingCard from '../components/ui/LoadingCard';
import EmptyState from '../components/ui/EmptyState';

export default function AttendancePage() {
  const { dojoId } = useParams();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Array<{ id: string; name?: string; userId?: string }>>([]);
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const id = dojoId ?? '';

  useEffect(() => {
    if (!id) return;

    void (async () => {
      setLoading(true);
      setMsg(null);

      const s = await getStudentsByDojo(id);
      setStudents(s);

      const att = await getAttendance(id, date).catch(() => []);
      const map: Record<string, boolean> = {};
      for (const st of s) map[st.id] = false;
      for (const r of att) map[r.userId] = r.present;

      setPresentMap(map);
      setLoading(false);
    })();
  }, [id, date]);

  const records = useMemo(() => {
    return students.map(st => {
      const userId = st.userId ?? st.id;
      return { userId, present: !!presentMap[userId] };
    });
  }, [students, presentMap]);

  const presentCount = useMemo(
    () => Object.values(presentMap).filter(Boolean).length,
    [presentMap],
  );

  const onSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saveAttendance(id, date, records);
      setMsg('Asistencia guardada correctamente');
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <EmptyState
        icon="⚠️"
        title="Falta dojo"
        description="No se encontró el identificador del dojo en la URL."
      />
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title="Asistencia"
        subtitle="Marca presente o ausente y guarda la lista del día."
        action={
          <Link className="link" to="/professor">
            ← Volver
          </Link>
        }
      />

      <div className="card">
        <div className="stat-grid">
          <div>
            <label className="muted" htmlFor="attendance-page-date">
              Fecha
            </label>
            <input
              id="attendance-page-date"
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <StatCard label="Presentes" value={`${presentCount}/${students.length}`} accent="success" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="button" type="button" onClick={() => void onSave()} disabled={saving || loading}>
              {saving ? 'Guardando…' : 'Guardar asistencia'}
            </button>
          </div>
        </div>
        {msg ? <p className="pill" style={{ marginTop: 12 }}>{msg}</p> : null}
      </div>

      {loading ? (
        <LoadingCard message="Cargando alumnos…" />
      ) : students.length === 0 ? (
        <EmptyState icon="👥" title="Sin alumnos" description="Este dojo no tiene alumnos registrados." />
      ) : (
        <div className="card">
          <ul className="content-list">
            {students.map(st => {
              const studentId = st.id;
              const name = st.name ?? 'Alumno';
              const present = !!presentMap[studentId];
              return (
                <li
                  key={studentId}
                  className={`student-item ${present ? 'present' : ''}`}
                  onClick={() => setPresentMap(p => ({ ...p, [studentId]: !p[studentId] }))}
                  role="button"
                  tabIndex={0}
                >
                  <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <span>👤 {name}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="muted">Presente</span>
                      <input
                        type="checkbox"
                        checked={present}
                        onChange={e => setPresentMap(p => ({ ...p, [studentId]: e.target.checked }))}
                        onClick={e => e.stopPropagation()}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
