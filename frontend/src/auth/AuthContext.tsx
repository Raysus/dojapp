import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  clearAuthStorage,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from '../platform/storage';
import { setCachedToken } from '../platform/token';
import { onUnauthorized } from '../platform/authEvents';
import { logoutRequest, type AuthTokens } from '../services/auth.service';

interface UserPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  exp?: number;
  type?: string;
}

interface AuthContextValue {
  user: UserPayload | null;
  loading: boolean;
  login: (tokens: AuthTokens | string) => UserPayload | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeValidToken(token: string): UserPayload | null {
  try {
    const decoded = jwtDecode<UserPayload>(token);
    if (decoded.type === 'refresh') return null;
    if (decoded.exp != null && decoded.exp * 1000 <= Date.now()) {
      return null;
    }
    if (!decoded.sub || !decoded.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (tokens: AuthTokens | string) => {
    const access = typeof tokens === 'string' ? tokens : tokens.access_token;
    const refresh = typeof tokens === 'string' ? undefined : tokens.refresh_token;
    const decoded = decodeValidToken(access);
    if (!decoded) {
      setCachedToken(null);
      void clearAuthStorage();
      setUser(null);
      return null;
    }

    setCachedToken(access);
    void setToken(access);
    if (refresh) void setRefreshToken(refresh);
    setUser(decoded);
    return decoded;
  };

  const logout = () => {
    void (async () => {
      const refresh = await getRefreshToken();
      await logoutRequest(refresh);
      setCachedToken(null);
      await clearAuthStorage();
      setUser(null);
    })();
  };

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = await getToken();

      if (!mounted) return;

      if (token) {
        const decoded = decodeValidToken(token);
        if (decoded) {
          setCachedToken(token);
          setUser(decoded);
        } else {
          setCachedToken(null);
          await clearAuthStorage();
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

  useEffect(() => {
    return onUnauthorized(() => {
      setCachedToken(null);
      void clearAuthStorage();
      setUser(null);
    });
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
