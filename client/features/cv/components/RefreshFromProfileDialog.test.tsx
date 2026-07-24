import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import RefreshFromProfileDialog from './RefreshFromProfileDialog';

describe('RefreshFromProfileDialog', () => {
  it('does not call refresh until sections are selected and confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <RefreshFromProfileDialog open onClose={() => {}} onConfirm={onConfirm} />,
    );

    expect(screen.getByText(/selected sections will be replaced/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /replace selected sections/i }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/^skills$/i));
    await user.click(screen.getByRole('button', { name: /replace selected sections/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(['skills']);
  });
});
