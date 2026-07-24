import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import CandidateContactForm from './CandidateContactForm';
import type { CandidateProfile } from '../../../shared/types/candidateProfile';

const profile: CandidateProfile = {
  headline: 'Engineer',
  publicEmail: 'good@example.com',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
};

describe('CandidateContactForm', () => {
  it('shows a valid email error for malformed public email', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <CandidateContactForm initialProfile={profile} onSave={onSave} />,
    );

    await user.clear(screen.getByLabelText(/public email/i));
    await user.type(screen.getByLabelText(/public email/i), 'bad-email');

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
