import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from './Theme'

function getDefaultRoute(role?: string) {
  if (role === 'PROFESSOR') return '/professor'
  if (role === 'STUDENT') return '/student'
  if (role === 'ADMIN') return '/admin'
  return '/'
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    if (location.pathname !== '/') navigate('/')
  }

  return (
    <header className="appHeader">
      <div className="appHeader-inner">
        <div className="appHeader-left">
          <NavLink to="/" className="brand">
            Dojapp
          </NavLink>

          {user && (
            <nav className="nav">
              <NavLink className="navLink" to={getDefaultRoute(user.role)}>
                Dashboard
              </NavLink>
            </nav>
          )}
        </div>

        <div className="appHeader-right">
          <ThemeToggle />

          {user ? (
            <>
              <span className="userBadge" title={user.email}>
                {user.email}
              </span>
              <button className="button secondary" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <NavLink className="button secondary" to="/">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
