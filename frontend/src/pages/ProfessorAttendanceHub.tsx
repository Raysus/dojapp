import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  if (loading) return <div className="card">Cargando…</div>;

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Asistencia</h2>
      <p className="muted">Elige un dojo para pasar lista.</p>

      {dojos.length === 0 ? (
        <div className="card">No tienes dojos asignados.</div>
      ) : (
        dojos.map(dojo => (
          <button
            key={dojo.id}
            type="button"
            className="card mobile-list-item"
            onClick={() => navigate(`/dojos/${dojo.id}/attendance`)}
          >
            <span style={{ fontWeight: 600 }}>🥋 {dojo.name}</span>
            <span className="muted">Pasar lista →</span>
          </button>
        ))
      )}
    </div>
  );
}
