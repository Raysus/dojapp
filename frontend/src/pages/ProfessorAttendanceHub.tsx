import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import LoadingCard from '../components/ui/LoadingCard';
import PageHeader from '../components/ui/PageHeader';
import { IconDojo } from '../components/icons';
import { getMyDojos } from '../services/dojos.service';

type Dojo = { id: string; name: string };

export default function ProfessorAttendanceHub() {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyDojos()
      .then(data => setDojos(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCard message="Cargando dojos…" />;

  return (
    <div className="stack">
      <PageHeader
        title="Asistencia"
        subtitle="Elige un dojo para pasar lista."
      />

      {dojos.length === 0 ? (
        <EmptyState
          icon={<IconDojo />}
          title="No tienes dojos asignados"
          description="Pide a un administrador que te asigne a un dojo."
        />
      ) : (
        dojos.map(dojo => (
          <button
            key={dojo.id}
            type="button"
            className="card mobile-list-item listActionCard"
            onClick={() => navigate(`/dojos/${dojo.id}/attendance`)}
          >
            <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconDojo aria-hidden /> {dojo.name}
            </span>
            <span className="muted">Pasar lista →</span>
          </button>
        ))
      )}
    </div>
  );
}
