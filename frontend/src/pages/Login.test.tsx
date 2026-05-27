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

    await userEvent.type(screen.getByPlaceholderText('Email'), 'alumno@dojo.cl');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(/No se pudo conectar con el servidor/i)).toBeInTheDocument();
  });

  it('redirects student after successful login', async () => {
    vi.mocked(loginRequest).mockResolvedValueOnce(
      makeJwt({ sub: '1', email: 'alumno@dojo.cl', role: 'STUDENT' }),
    );

    renderWithProviders(<Login />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'alumno@dojo.cl');
    await userEvent.type(screen.getByPlaceholderText('Password'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/student');
    });
  });
});
