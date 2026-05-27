import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/auth.service';
import { useAuth } from '../auth/AuthContext';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import '../styles/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const token = await loginRequest(email, password);
      const user = login(token);

      if (!user) {
        setError('Error al iniciar sesión');
        return;
      }

      if (user.role === 'PROFESSOR') {
        navigate('/professor');
      } else if (user.role === 'STUDENT') {
        navigate('/student');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/unauthorized');
      }
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
            <span className="badge">Admin metrics</span>
            <span className="badge">Asistencia</span>
            <span className="badge">Progreso</span>
          </div>
        </div>

        <div className="login-card">
          <h2 className="login-title">Iniciar sesión</h2>
          <p className="login-subtitle">Ingresa con tu correo y contraseña.</p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="label">Contraseña</div>
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error">{error}</div>}

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