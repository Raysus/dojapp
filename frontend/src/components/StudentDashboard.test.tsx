import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentDashboard from './StudentDashboard';
import { renderWithProviders } from '../test/test-utils';

vi.mock('../services/students.service', () => ({
  getMyContents: vi.fn(),
  getMyStats: vi.fn(),
}));

vi.mock('../services/users.service', () => ({
  getMyProfile: vi.fn(),
}));

import { getMyContents, getMyStats } from '../services/students.service';
import { getMyProfile } from '../services/users.service';

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.mocked(getMyContents).mockReset();
    vi.mocked(getMyStats).mockReset();
    vi.mocked(getMyProfile).mockReset();
    vi.mocked(getMyProfile).mockResolvedValue({
      id: 'u1',
      email: 'alumno@dojo.cl',
      name: 'Alumno',
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      dojos: [],
    });
  });

  it('renders empty state when student has no contents', async () => {
    vi.mocked(getMyContents).mockResolvedValueOnce([]);
    vi.mocked(getMyStats).mockResolvedValueOnce([]);

    renderWithProviders(<StudentDashboard />);

    expect(await screen.findByText('Sin dojo asignado')).toBeInTheDocument();
    expect(screen.getByText('Completar mis datos')).toBeInTheDocument();
  });

  it('renders dojo stats and content list', async () => {
    vi.mocked(getMyContents).mockResolvedValueOnce([
      {
        dojoId: 'dojo-1',
        dojoName: 'Dojo Central',
        grade: 'Cinturón Blanco',
        contents: [
          {
            id: 'content-1',
            title: 'Kihon Básico',
            type: 'VIDEO',
            url: null,
            body: null,
            createdAt: new Date().toISOString(),
            gradeId: 'grade-1',
            completed: false,
          },
        ],
      },
    ]);
    vi.mocked(getMyStats).mockResolvedValueOnce([
      {
        dojoId: 'dojo-1',
        dojoName: 'Dojo Central',
        grade: 'Cinturón Blanco',
        progress: { completed: 1, total: 3, percentage: 33 },
        attendance: { attendedClasses: 4, totalClasses: 5, percentage: 80 },
      },
    ]);

    renderWithProviders(<StudentDashboard />, { route: '/student' });

    expect(await screen.findByText('Dojo Central')).toBeInTheDocument();
    expect(screen.getByText('Kihon Básico')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Kihon Básico'));
  });
});
