import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { makeJwt, renderWithProviders } from '../test/test-utils';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/auth.service', () => ({
  loginRequest: vi.fn(),
}));

import { loginRequest } from '../services/auth.service';

describe('Login', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.mocked(loginRequest).mockReset();
  });

  it('shows validation error message on failed login', async () => {
    vi.mocked(loginRequest).mockRejectedValueOnce(new Error('Network Error'));

    renderWithProviders(<Login />);

    await userEvent.type(await screen.findByLabelText('Email'), 'alumno@dojo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo conectar con el servidor/i);
  });

  it('redirects student after successful login', async () => {
    vi.mocked(loginRequest).mockResolvedValueOnce({
      access_token: makeJwt({ sub: '1', email: 'alumno@dojo.cl', role: 'STUDENT', type: 'access' }),
      refresh_token: makeJwt({ sub: '1', email: 'alumno@dojo.cl', role: 'STUDENT', type: 'refresh' }),
    });

    renderWithProviders(<Login />);

    await userEvent.type(await screen.findByLabelText('Email'), 'alumno@dojo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/student');
    });
  });
});
