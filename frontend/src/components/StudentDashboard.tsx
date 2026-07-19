import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import {
  getMyContents,
  getMyStats,
  type StudentContentsByDojo,
  type StudentStatsByDojo,
} from '../services/students.service';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import EmptyState from './ui/EmptyState';
import LoadingCard from './ui/LoadingCard';
import { IconDojo } from './icons';

export default function StudentDashboard() {
  const [items, setItems] = useState<StudentContentsByDojo[]>([]);
  const [stats, setStats] = useState<StudentStatsByDojo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [contents, s] = await Promise.all([
          getMyContents(),
          getMyStats().catch(() => [] as StudentStatsByDojo[]),
        ]);

        const nextIds = new Set(contents.flatMap(b => b.contents.map(c => c.id)));
        if (prevIds.current.size > 0) {
          const unlocked = new Set<string>();
          nextIds.forEach(id => {
            if (!prevIds.current.has(id)) unlocked.add(id);
          });
          if (unlocked.size) {
            setJustUnlocked(unlocked);
            window.setTimeout(() => setJustUnlocked(new Set()), 1200);
          }
        }
        prevIds.current = nextIds;

        setItems(contents);
        setStats(s);
      } catch (e) {
        setError(getNetworkErrorMessage(e) ?? 'No se pudieron cargar tus contenidos.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingCard message="Cargando tu progreso…" />;
  if (error) return <div className="card alert error">{error}</div>;
  if (!items.length) {
    return (
      <div className="stack">
        <PageHeader
          title="Mi entrenamiento"
          subtitle="Aún no tienes un dojo o contenidos asignados."
        />
        <EmptyState
          icon={<IconDojo />}
          title="Sin dojo asignado"
          description="Pide a tu sensei o a un administrador que te asigne a un dojo y un grado. Cuando lo hagan, verás aquí tus contenidos."
        />
        <div className="row">
          <Link className="button secondary" to="/account">
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title="Mi entrenamiento"
        subtitle="Consulta tu progreso, asistencia y contenidos desbloqueados."
      />

      {items.map(block => {
        const dojoStats = stats.find(s => s.dojoId === block.dojoId);

        return (
          <section key={block.dojoId} className="stack">
            <div className="card">
              <div className="dojo-cardHeader">
                <div className="dojo-cardTitle">
                  <span className="dojo-cardIcon" aria-hidden="true">
                    <IconDojo />
                  </span>
                  <div>
                    <h2>{block.dojoName}</h2>
                    <p className="muted">Grado: {block.grade}</p>
                  </div>
                </div>
                <span className="pill">{block.contents.length} visibles</span>
              </div>

              {dojoStats ? (
                <div className="stat-grid" style={{ marginTop: 16 }}>
                  <StatCard
                    label="Progreso"
                    value={`${dojoStats.progress.percentage}%`}
                    hint={`${dojoStats.progress.completed}/${dojoStats.progress.total} completados`}
                    accent="success"
                  />
                  <StatCard
                    label="Asistencia"
                    value={`${dojoStats.attendance.percentage}%`}
                    hint={`${dojoStats.attendance.attendedClasses}/${dojoStats.attendance.totalClasses} clases`}
                  />
                  <StatCard
                    label="Contenidos"
                    value={block.contents.length}
                    hint="Disponibles ahora"
                  />
                </div>
              ) : null}
            </div>

            <div className="card">
              <h3>Contenidos</h3>
              {block.contents.length === 0 ? (
                <EmptyState
                  icon={<IconDojo />}
                  title="Sin contenidos en este dojo"
                  description="Cuando tu sensei publique material para tu grado, aparecerá aquí."
                />
              ) : (
                <ul className="content-list" style={{ marginTop: 14 }}>
                  {block.contents.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`listAction content-item unlocked${justUnlocked.has(c.id) ? ' just-unlocked' : ''}`}
                        onClick={() => navigate(`/dojos/${block.dojoId}/contents/${c.id}`)}
                      >
                        <span className="content-listItem">
                          <span className="content-listItemMain">
                            <span className="content-listItemTitle">{c.title}</span>
                            <span className="content-listItemMeta">
                              {c.gradeId ? 'Por grado' : 'Global'}
                            </span>
                          </span>
                          <span className="content-typeBadge">{c.type}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
