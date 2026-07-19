import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import { IconSettings } from '../components/icons';

export default function Unauthorized() {
  return (
    <div className="stack">
      <EmptyState
        icon={<IconSettings />}
        title="Acceso no autorizado"
        description="No tienes permisos para ver esta página. Inicia sesión con una cuenta adecuada o vuelve al inicio."
      />
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link className="button secondary" to="/login">
          Ir al login
        </Link>
        <Link className="button ghost" to="/">
          Inicio
        </Link>
      </div>
    </div>
  );
}
