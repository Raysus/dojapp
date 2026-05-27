import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NetworkBanner from './NetworkBanner';

vi.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(),
}));

import { useNetworkStatus } from '../hooks/useNetworkStatus';

describe('NetworkBanner', () => {
  it('is hidden when online', () => {
    vi.mocked(useNetworkStatus).mockReturnValue(true);

    render(
      <MemoryRouter>
        <NetworkBanner />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/Sin conexión/i)).not.toBeInTheDocument();
  });

  it('shows offline message when disconnected', () => {
    vi.mocked(useNetworkStatus).mockReturnValue(false);

    render(
      <MemoryRouter>
        <NetworkBanner />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument();
  });
});
