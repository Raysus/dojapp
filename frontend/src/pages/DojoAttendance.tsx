import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNetworkErrorMessage, useNetworkStatus } from '../hooks/useNetworkStatus';
import { getAttendanceForDate, markAttendance } from '../services/professor.service';
import {
  clearAttendanceDraft,
  loadAttendanceDraft,
  saveAttendanceDraft,
} from '../platform/attendanceDraft';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import LoadingCard from '../components/ui/LoadingCard';
import EmptyState from '../components/ui/EmptyState';
import { IconDojo, IconUser } from '../components/icons';

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DojoAttendance() {
  const { dojoId } = useParams();
  const online = useNetworkStatus();
  const [date, setDate] = useState<string>(() => toISODate(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ userId: string; name: string; present: boolean }>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSaved(false);

        const draft = dojoId ? await loadAttendanceDraft(dojoId, date) : null;
        if (draft?.pendingSync && draft.items.length) {
          if (!mounted) return;
          setItems(draft.items);
          setPendingSync(true);
          return;
        }

        if (!online) {
          if (draft?.items?.length) {
            if (!mounted) return;
            setItems(draft.items);
            setPendingSync(!!draft.pendingSync);
            return;
          }
          setError('Sin conexión y no hay borrador local para esta fecha.');
          setItems([]);
          return;
        }

        const data = await getAttendanceForDate(dojoId!, date);
        if (!mounted) return;
        setItems(data.map(x => ({ userId: x.userId, name: x.name, present: x.present })));
        setPendingSync(false);
      } catch (e) {
        if (!mounted) return;
        const draft = dojoId ? await loadAttendanceDraft(dojoId, date) : null;
        if (draft?.items?.length) {
          setItems(draft.items);
          setPendingSync(!!draft.pendingSync);
          setError('Usando borrador local (no se pudo cargar del servidor).');
        } else {
          setError(getNetworkErrorMessage(e) ?? 'No se pudo cargar la asistencia.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (dojoId) void load();
    return () => {
      mounted = false;
    };
  }, [dojoId, date, online]);

  useEffect(() => {
    if (!online || !pendingSync || !dojoId || !items.length) return;
    let cancelled = false;
    async function flush() {
      try {
        setSaving(true);
        await markAttendance(
          dojoId!,
          items.map(i => ({ userId: i.userId, present: i.present, date })),
        );
        if (cancelled) return;
        await clearAttendanceDraft(dojoId!, date);
        setPendingSync(false);
        setSaved(true);
        setError(null);
      } catch {
        // keep pending
      } finally {
        if (!cancelled) setSaving(false);
      }
    }
    void flush();
    return () => {
      cancelled = true;
    };
  }, [online, pendingSync, dojoId, date, items]);

  const presentCount = useMemo(() => items.filter(i => i.present).length, [items]);

  const toggle = (userId: string) => {
    setSaved(false);
    setItems(prev => {
      const next = prev.map(i => (i.userId === userId ? { ...i, present: !i.present } : i));
      if (dojoId) {
        void saveAttendanceDraft({
          dojoId,
          date,
          items: next,
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });
        setPendingSync(true);
      }
      return next;
    });
  };

  const save = async () => {
    if (!dojoId) return;
    try {
      setSaving(true);
      setError(null);

      await saveAttendanceDraft({
        dojoId,
        date,
        items,
        updatedAt: new Date().toISOString(),
        pendingSync: true,
      });

      if (!online) {
        setPendingSync(true);
        setSaved(false);
        setError(null);
        return;
      }

      await markAttendance(
        dojoId,
        items.map(i => ({ userId: i.userId, present: i.present, date })),
      );
      await clearAttendanceDraft(dojoId, date);
      setPendingSync(false);
      setSaved(true);
    } catch (e) {
      setPendingSync(true);
      setError(
        getNetworkErrorMessage(e) ??
          'No se pudo guardar en el servidor. El borrador quedó guardado en este dispositivo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Asistencia"
        subtitle="Marca presente o ausente. Si no hay red, se guarda un borrador local."
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
              {saving
                ? 'Guardando…'
                : !online
                  ? 'Guardar borrador offline'
                  : 'Guardar asistencia'}
            </button>
          </div>
        </div>

        {!online ? (
          <p className="pill" style={{ marginTop: 12 }}>
            Sin conexión — los cambios se sincronizan al volver online
          </p>
        ) : null}
        {pendingSync ? (
          <p className="pill" style={{ marginTop: 12 }}>
            Borrador pendiente de sincronizar
          </p>
        ) : null}
        {saved ? <p className="pill" style={{ marginTop: 12 }}>Lista guardada correctamente</p> : null}
        {error ? (
          <p className="alert error" style={{ marginTop: 12 }} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {loading ? (
        <LoadingCard message="Cargando alumnos…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconDojo />}
          title="Sin alumnos"
          description="Este dojo no tiene alumnos registrados todavía. Pide a un admin que asigne alumnos."
        />
      ) : (
        <div className="card">
          <h3>Lista de alumnos</h3>
          <ul className="content-list" style={{ marginTop: 12 }}>
            {items.map(i => (
              <li key={i.userId} className={`student-item ${i.present ? 'present' : ''}`}>
                <label className="attendanceRow">
                  <span className="attendanceRow-name">
                    <IconUser aria-hidden /> {i.name}
                  </span>
                  <span className="attendanceRow-control">
                    <span className="muted">Presente</span>
                    <input
                      type="checkbox"
                      checked={i.present}
                      onChange={() => toggle(i.userId)}
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
