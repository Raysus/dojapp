import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ThemeToggle } from './Theme';
import { IconBrand } from './icons';

function getDefaultRoute(role?: string) {
  if (role === 'PROFESSOR') return '/professor';
  if (role === 'STUDENT') return '/student';
  if (role === 'ADMIN') return '/admin';
  return '/';
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <header className="appHeader">
      <div className="appHeader-inner">
        <div className="appHeader-left">
          <NavLink to="/" className="brand">
            <span className="brandMark" aria-hidden="true">
              <IconBrand />
            </span>
            <span className="brandName">Dojapp</span>
          </NavLink>

          {user ? (
            <nav className="nav" aria-label="Principal">
              <NavLink className="navLink" to={getDefaultRoute(user.role)}>
                Inicio
              </NavLink>
              <NavLink className="navLink" to="/account">
                Cuenta
              </NavLink>
            </nav>
          ) : null}
        </div>

        <div className="appHeader-right">
          <ThemeToggle />

          {user ? (
            <>
              <span className="userBadge" title={user.email}>
                {user.name || user.email}
              </span>
              <button className="button secondary" type="button" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <NavLink className="button secondary" to="/login">
              Entrar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
