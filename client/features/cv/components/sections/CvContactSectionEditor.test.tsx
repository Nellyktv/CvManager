import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import CvContactSectionEditor from './CvContactSectionEditor';

const baseContact = {
  name: 'Artem',
  email: 'artem@example.com',
  links: [{ label: 'GitHub', url: 'https://github.com/example' }],
};

const primaryFieldLabels = [
  /full name|name/i,
  /headline/i,
  /email/i,
  /phone/i,
  /location/i,
];

describe('CvContactSectionEditor', () => {
  it('exposes primary contact fields with accessible labels', () => {
    renderWithProviders(
      <CvContactSectionEditor contact={baseContact} onChange={() => {}} />,
    );

    for (const label of primaryFieldLabels) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
  });

  it('does not insert empty link placeholders into autosaved contact data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvContactSectionEditor contact={baseContact} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /add link/i }));

    expect(onChange).not.toHaveBeenCalled();
    const labels = screen.getAllByLabelText(/link label/i);
    const urls = screen.getAllByLabelText(/link url/i);
    expect(labels[labels.length - 1]).toHaveValue('');
    expect(urls[urls.length - 1]).toHaveValue('');
  });

  it('appends a contact link only after a valid URL is committed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvContactSectionEditor contact={baseContact} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /add link/i }));
    const labels = screen.getAllByLabelText(/link label/i);
    const urls = screen.getAllByLabelText(/link url/i);
    await user.type(labels[labels.length - 1], 'Portfolio');
    await user.type(urls[urls.length - 1], 'https://example.dev');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith({
      ...baseContact,
      links: [
        ...baseContact.links,
        { label: 'Portfolio', url: 'https://example.dev' },
      ],
    });
  });
});
