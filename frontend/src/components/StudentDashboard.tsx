import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function StudentDashboard() {
  const [items, setItems] = useState<StudentContentsByDojo[]>([]);
  const [stats, setStats] = useState<StudentStatsByDojo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [contents, s] = await Promise.all([
          getMyContents(),
          getMyStats().catch(() => [] as StudentStatsByDojo[]),
        ]);
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
      <EmptyState
        icon="🥋"
        title="Sin contenidos disponibles"
        description="Cuando tu sensei publique material para tu grado, aparecerá aquí."
      />
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
                  <span className="dojo-cardIcon">🥋</span>
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
                <p className="muted">No hay contenidos disponibles en este dojo.</p>
              ) : (
                <ul className="content-list" style={{ marginTop: 14 }}>
                  {block.contents.map(c => (
                    <li
                      key={c.id}
                      className="content-item unlocked"
                      onClick={() => navigate(`/dojos/${block.dojoId}/contents/${c.id}`)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/dojos/${block.dojoId}/contents/${c.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="content-listItem">
                        <div className="content-listItemMain">
                          <div className="content-listItemTitle">{c.title}</div>
                          <div className="content-listItemMeta">
                            {c.gradeId ? 'Por grado' : 'Global'}
                          </div>
                        </div>
                        <span className="content-typeBadge">{c.type}</span>
                      </div>
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
