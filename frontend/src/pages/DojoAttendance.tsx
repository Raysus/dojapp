import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import { getAttendanceForDate, markAttendance } from '../services/professor.service';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import LoadingCard from '../components/ui/LoadingCard';
import EmptyState from '../components/ui/EmptyState';

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ userId: string; name: string; present: boolean }>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSaved(false);
        const data = await getAttendanceForDate(dojoId!, date);
        if (!mounted) return;
        setItems(data.map(x => ({ userId: x.userId, name: x.name, present: x.present })));
      } catch (e) {
        if (!mounted) return;
        setError(getNetworkErrorMessage(e) ?? 'No se pudo cargar la asistencia.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (dojoId) void load();
    return () => {
      mounted = false;
    };
  }, [dojoId, date]);

  const presentCount = useMemo(() => items.filter(i => i.present).length, [items]);

  const toggle = (userId: string) => {
    setSaved(false);
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
      setSaved(true);
    } catch (e) {
      setError(getNetworkErrorMessage(e) ?? 'No se pudo guardar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

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
            <label className="muted" htmlFor="attendance-date">
              Fecha
            </label>
            <input
              id="attendance-date"
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <StatCard
            label="Presentes"
            value={`${presentCount}/${items.length}`}
            hint="Alumnos marcados"
            accent="success"
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="button" type="button" onClick={() => void save()} disabled={saving || loading}>
              {saving ? 'Guardando…' : 'Guardar asistencia'}
            </button>
          </div>
        </div>

        {saved ? <p className="pill" style={{ marginTop: 12 }}>Lista guardada correctamente</p> : null}
        {error ? <p className="alert error" style={{ marginTop: 12 }}>{error}</p> : null}
      </div>

      {loading ? (
        <LoadingCard message="Cargando alumnos…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Sin alumnos"
          description="Este dojo no tiene alumnos registrados todavía."
        />
      ) : (
        <div className="card">
          <h3>Lista de alumnos</h3>
          <ul className="content-list" style={{ marginTop: 12 }}>
            {items.map(i => (
              <li
                key={i.userId}
                className={`student-item ${i.present ? 'present' : ''}`}
                onClick={() => toggle(i.userId)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(i.userId);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span>👤 {i.name}</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="muted">Presente</span>
                    <input
                      type="checkbox"
                      checked={i.present}
                      onChange={() => toggle(i.userId)}
                      onClick={e => e.stopPropagation()}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
