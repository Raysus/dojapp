import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ThemeToggle } from '../components/Theme';
import PageHeader from '../components/ui/PageHeader';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Profesor',
  STUDENT: 'Alumno',
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="stack">
      <PageHeader title="Mi cuenta" subtitle="Perfil, preferencias y sesión." />

      <div className="card stack">
        <div>
          <div className="muted">Correo</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{user.email}</div>
        </div>

        <div>
          <div className="muted">Rol</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{roleLabels[user.role] ?? user.role}</div>
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Tema</span>
          <ThemeToggle />
        </div>
      </div>

      <button className="button secondary" type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>

      <Link className="link" to="/privacy">
        Política de privacidad
      </Link>
    </div>
  );
}
