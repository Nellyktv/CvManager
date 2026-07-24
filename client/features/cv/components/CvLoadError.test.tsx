import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import CvLoadError from './CvLoadError';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('CvLoadError', () => {
  it('renders a recoverable error with a back-to-CVs action, not a skeleton', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<CvLoadError onRetry={onRetry} />);

    expect(screen.getByText(/could not load this cv/i)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(document.querySelector('.MuiSkeleton-root')).toBeNull();

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /back to cvs/i }));
    expect(navigate).toHaveBeenCalledWith('/cv');
  });
});
