import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getToken, removeToken, setToken } from '../platform/storage';
import { setCachedToken } from '../platform/token';

interface UserPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
}

interface AuthContextValue {
  user: UserPayload | null;
  loading: boolean;
  login: (token: string) => UserPayload | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (token: string) => {
    try {
      const decoded = jwtDecode<UserPayload>(token);
      setCachedToken(token);
      void setToken(token);
      setUser(decoded);
      return decoded;
    } catch {
      setCachedToken(null);
      void removeToken();
      setUser(null);
      return null;
    }
  };

  const logout = () => {
    setCachedToken(null);
    void removeToken();
    setUser(null);
  };

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = await getToken();

      if (!mounted) return;

      if (token) {
        try {
          const decoded = jwtDecode<UserPayload>(token);
          setCachedToken(token);
          setUser(decoded);
        } catch {
          setCachedToken(null);
          await removeToken();
          setUser(null);
        }
      }

      if (mounted) setLoading(false);
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
