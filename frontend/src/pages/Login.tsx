import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/auth.service';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
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
      } else {
        navigate('/unauthorized');
      }
    } catch {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit">Entrar</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
