import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import CvTemplatePicker from './CvTemplatePicker';

describe('CvTemplatePicker', () => {
  it('opens a thumbnail menu from a compact Template trigger', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CvTemplatePicker value="editorial-sidebar" onChange={() => {}} />,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /template/i }));
    expect(screen.getByRole('menu')).toBeVisible();

    const editorial = screen.getByRole('menuitemradio', { name: /editorial sidebar/i });
    const structured = screen.getByRole('menuitemradio', { name: /structured minimal/i });

    expect(editorial).toHaveAttribute('aria-checked', 'true');
    expect(structured).toHaveAttribute('aria-checked', 'false');
  });

  it('selects a template from the menu and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvTemplatePicker value="editorial-sidebar" onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /template/i }));
    expect(screen.getByRole('menu')).toBeVisible();

    await user.click(screen.getByRole('menuitemradio', { name: /structured minimal/i }));

    expect(onChange).toHaveBeenCalledWith('structured-minimal');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('returns focus to the Template trigger when the menu closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvTemplatePicker value="editorial-sidebar" onChange={onChange} />,
    );

    const trigger = screen.getByRole('button', { name: /template/i });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeVisible();

    await user.click(screen.getByRole('menuitemradio', { name: /structured minimal/i }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('shows the current template name on the compact trigger', () => {
    renderWithProviders(
      <CvTemplatePicker value="structured-minimal" onChange={() => {}} />,
    );

    expect(
      screen.getByRole('button', { name: /template.*structured minimal/i }),
    ).toBeInTheDocument();
  });

  it('marks the decorative selected check icon as aria-hidden', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CvTemplatePicker value="editorial-sidebar" onChange={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /template/i }));

    const selected = screen.getByRole('menuitemradio', {
      name: /editorial sidebar/i,
    });
    const checkIcon = within(selected).getByTestId('CheckIcon');
    expect(checkIcon).toHaveAttribute('aria-hidden', 'true');
  });
});
