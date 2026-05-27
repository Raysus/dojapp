import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';

function encodePart(value: unknown) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

type Options = RenderOptions & {
  route?: string;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export function makeJwt(payload: Record<string, unknown>) {
  return `${encodePart({ alg: 'none', typ: 'JWT' })}.${encodePart(payload)}.signature`;
}

export function seedAuthToken(payload: Record<string, unknown>) {
  const token = makeJwt(payload);
  localStorage.setItem('token', token);
  return token;
}
