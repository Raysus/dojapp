import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/auth.service';
import { useAuth } from '../auth/AuthContext';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LoadingCard from '../components/ui/LoadingCard';
import '../styles/login.css';

function homeForRole(role: string) {
  if (role === 'PROFESSOR') return '/professor';
  if (role === 'STUDENT') return '/student';
  if (role === 'ADMIN') return '/admin';
  return '/unauthorized';
}

export default function Login() {
  useDocumentTitle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingCard message="Restaurando sesión…" />;
  }

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const tokens = await loginRequest(email, password);
      const nextUser = login(tokens);

      if (!nextUser) {
        setError('Error al iniciar sesión');
        return;
      }

      navigate(homeForRole(nextUser.role));
    } catch (err) {
      setError(getNetworkErrorMessage(err) ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-hero">
          <h1>Dojapp</h1>
          <p>Gestiona dojos, contenidos, asistencia y métricas en un solo lugar.</p>

          <div className="login-badges">
            <span className="badge">Métricas</span>
            <span className="badge">Asistencia</span>
            <span className="badge">Progreso</span>
          </div>
        </div>

        <div className="login-card">
          <h2 className="login-title">Iniciar sesión</h2>
          <p className="login-subtitle">Ingresa con tu correo y contraseña.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="login-password">
                Contraseña
              </label>
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            <div className="footer">© {new Date().getFullYear()} Dojapp</div>
          </form>
        </div>
      </div>
    </div>
  );
}
