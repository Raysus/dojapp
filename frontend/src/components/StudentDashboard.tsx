import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import {
  getMyContents,
  getMyStats,
  type StudentContentsByDojo,
  type StudentStatsByDojo,
} from '../services/students.service';
import { getMyProfile } from '../services/users.service';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import EmptyState from './ui/EmptyState';
import LoadingCard from './ui/LoadingCard';
import { IconDojo } from './icons';

export default function StudentDashboard() {
  const [items, setItems] = useState<StudentContentsByDojo[]>([]);
  const [stats, setStats] = useState<StudentStatsByDojo[]>([]);
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsWarning, setStatsWarning] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setError(null);
        setStatsWarning(null);

        const [contents, s, profile] = await Promise.all([
          getMyContents(),
          getMyStats().catch(() => {
            if (mounted) {
              setStatsWarning('No se pudieron cargar progreso y asistencia.');
            }
            return [] as StudentStatsByDojo[];
          }),
          getMyProfile().catch(() => null),
        ]);

        if (!mounted) return;

        setItems(contents);
        setStats(s);
        setHasMembership((profile?.dojos?.length ?? 0) > 0 || contents.length > 0);
      } catch (e) {
        if (!mounted) return;
        setError(getNetworkErrorMessage(e) ?? 'No se pudieron cargar tus contenidos.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const onFocus = () => {
      void getMyContents()
        .then(contents => {
          if (mounted) setItems(contents);
        })
        .catch(() => undefined);
      void getMyStats()
        .then(s => {
          if (mounted) {
            setStats(s);
            setStatsWarning(null);
          }
        })
        .catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (loading) return <LoadingCard message="Cargando tu progreso…" />;
  if (error) {
    return (
      <div className="stack">
        <div className="card alert error" role="alert">
          {error}
        </div>
        <button className="button secondary" type="button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="stack">
        <PageHeader
          title="Mi entrenamiento"
          subtitle={
            hasMembership
              ? 'Tu dojo aún no tiene grado o contenidos disponibles.'
              : 'Aún no tienes un dojo asignado.'
          }
        />
        <EmptyState
          icon={<IconDojo />}
          title={hasMembership ? 'Sin contenidos disponibles' : 'Sin dojo asignado'}
          description={
            hasMembership
              ? 'Pide a tu sensei que te asigne un grado o publique material para tu nivel.'
              : 'Pide a tu sensei o a un administrador que te asigne a un dojo y un grado. Cuando lo hagan, verás aquí tus contenidos.'
          }
        />
        <div className="row">
          <Link className="button secondary" to="/account">
            Completar mis datos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title="Mi entrenamiento"
        subtitle="Consulta tu progreso, asistencia y contenidos disponibles."
        action={
          <Link className="button secondary" to="/account">
            Mis datos
          </Link>
        }
      />

      {statsWarning ? (
        <div className="alert error" role="status">
          {statsWarning}
        </div>
      ) : null}

      {items.map(block => {
        const dojoStats = stats.find(s => s.dojoId === block.dojoId);
        const completedCount = block.contents.filter(c => c.completed).length;

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
                <span className="pill">
                  {completedCount}/{block.contents.length} completados
                </span>
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
                        className={`listAction content-item${c.completed ? ' completed' : ' unlocked'}`}
                        onClick={() => navigate(`/dojos/${block.dojoId}/contents/${c.id}`)}
                      >
                        <span className="content-listItem">
                          <span className="content-listItemMain">
                            <span className="content-listItemTitle">{c.title}</span>
                            <span className="content-listItemMeta">
                              {c.gradeId ? 'Por grado' : 'Global'}
                              {c.completed ? ' · Completado' : ''}
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
