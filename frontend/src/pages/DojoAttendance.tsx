import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAttendanceForDate, markAttendance } from '../services/professor.service';

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DojoAttendance() {
  const { dojoId } = useParams();

  const [date, setDate] = useState<string>(() => toISODate(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ userId: string; name: string; present: boolean }>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAttendanceForDate(dojoId!, date);
        if (!mounted) return;
        setItems(data.map(x => ({ userId: x.userId, name: x.name, present: x.present })));
      } catch (e) {
        if (!mounted) return;
        setError('No se pudo cargar la asistencia.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    if (dojoId) load();
    return () => {
      mounted = false;
    };
  }, [dojoId, date]);

  const presentCount = useMemo(() => items.filter(i => i.present).length, [items]);

  const toggle = (userId: string) => {
    setItems(prev => prev.map(i => (i.userId === userId ? { ...i, present: !i.present } : i)));
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      await markAttendance(
        dojoId!,
        items.map(i => ({ userId: i.userId, present: i.present, date })),
      );
    } catch (e) {
      setError('No se pudo guardar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>✅ Asistencia</h2>
      <Link className="link" to="/professor">← Volver</Link>

      <div className="divider" />

      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <div>
            <div className="muted">Fecha</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'inherit' }}
            />
          </div>

          <div>
            <div className="muted">Presentes</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{presentCount}/{items.length}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <button className="button" onClick={save} disabled={saving || loading}>
              {saving ? 'Guardando…' : 'Guardar asistencia'}
            </button>
          </div>
        </div>

        {error && <p className="alert error" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      {loading ? (
        <p>Cargando alumnos…</p>
      ) : (
        <div className="card">
          <h3>Alumnos</h3>
          {items.length === 0 ? (
            <p>No hay alumnos en este dojo.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map(i => (
                <li
                  key={i.userId}
                  className="student-item"
                  onClick={() => toggle(i.userId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(i.userId);
                    }
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>👤 {i.name}</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="muted">Presente</span>
                    <input
                      type="checkbox"
                      checked={i.present}
                      onChange={() => toggle(i.userId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
