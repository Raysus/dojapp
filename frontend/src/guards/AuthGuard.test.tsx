import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import AuthGuard from './AuthGuard';
import { renderWithProviders, seedAuthToken } from '../test/test-utils';

function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Privado</div>
    </AuthGuard>
  );
}

describe('AuthGuard', () => {
  it('redirects unauthenticated users to login', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Página de login</div>} />
        <Route path="/student" element={<ProtectedPage />} />
      </Routes>,
      { route: '/student' },
    );

    await waitFor(() => {
      expect(screen.getByText('Página de login')).toBeInTheDocument();
    });
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', async () => {
    seedAuthToken({ sub: '1', email: 'alumno@dojo.cl', role: 'STUDENT' });

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<ProtectedPage />} />
      </Routes>,
      { route: '/student' },
    );

    expect(await screen.findByText('Privado')).toBeInTheDocument();
  });
});
