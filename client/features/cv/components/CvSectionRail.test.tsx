import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import CvSectionRail from './CvSectionRail';

describe('CvSectionRail', () => {
  it('notifies onChange when a section is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvSectionRail value="contact" onChange={onChange} content={cvContentFixture} />,
    );

    await user.click(screen.getByRole('button', { name: /education/i }));
    expect(onChange).toHaveBeenCalledWith('education');
  });

  it('includes item counts in list section accessible names', () => {
    renderWithProviders(
      <CvSectionRail value="contact" onChange={() => {}} content={cvContentFixture} />,
    );

    expect(screen.getByRole('button', { name: /skills/i })).toHaveAccessibleName(/skills.*3/i);
  });

  it('shows visible completion and count for every rail item', () => {
    renderWithProviders(
      <CvSectionRail value="contact" onChange={() => {}} content={cvContentFixture} />,
    );

    const contact = screen.getByRole('button', { name: /contact/i });
    expect(contact).toHaveAccessibleName(/,\s*Complete$/);
    expect(contact).toHaveTextContent(/Complete/);
    expect(contact).not.toHaveTextContent(/Incomplete/);

    const skills = screen.getByRole('button', { name: /skills/i });
    expect(skills).toHaveAccessibleName(/Skills,\s*3,\s*Complete$/);
    expect(skills).toHaveTextContent(/3/);
    expect(skills).toHaveTextContent(/Complete/);
    expect(skills).not.toHaveTextContent(/Incomplete/);

    const education = screen.getByRole('button', { name: /education/i });
    expect(education).toHaveAccessibleName(/Education,\s*1,\s*Complete$/);
    expect(education).toHaveTextContent(/1/);
    expect(education).toHaveTextContent(/Complete/);
    expect(education).not.toHaveTextContent(/Incomplete/);

    const projects = screen.getByRole('button', { name: /projects/i });
    expect(projects).toHaveAccessibleName(/Projects,\s*1,\s*Complete$/);
    expect(projects).toHaveTextContent(/1/);
    expect(projects).toHaveTextContent(/Complete/);
    expect(projects).not.toHaveTextContent(/Incomplete/);
  });

  it('marks contact incomplete without name or email', () => {
    renderWithProviders(
      <CvSectionRail
        value="contact"
        onChange={() => {}}
        content={{
          ...cvContentFixture,
          contact: { ...cvContentFixture.contact, name: '', email: '' },
        }}
      />,
    );

    const contact = screen.getByRole('button', { name: /contact/i });
    expect(contact).toHaveAccessibleName(/,\s*Incomplete$/);
    expect(contact).toHaveTextContent(/Incomplete/);
  });

  it('marks skills and projects incomplete when empty', () => {
    renderWithProviders(
      <CvSectionRail
        value="contact"
        onChange={() => {}}
        content={{ ...cvContentFixture, skills: [], projects: [] }}
      />,
    );

    expect(screen.getByRole('button', { name: /skills/i })).toHaveTextContent(/Incomplete/);
    expect(screen.getByRole('button', { name: /projects/i })).toHaveTextContent(/Incomplete/);
  });

  it('marks education complete only when a nonblank institution exists', () => {
    const { rerender } = renderWithProviders(
      <CvSectionRail
        value="contact"
        onChange={() => {}}
        content={{
          ...cvContentFixture,
          education: [{ ...cvContentFixture.education[0], institution: '   ' }],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /education/i })).toHaveTextContent(/Incomplete/);

    rerender(
      <CvSectionRail
        value="contact"
        onChange={() => {}}
        content={{
          ...cvContentFixture,
          education: [{ ...cvContentFixture.education[0], institution: 'BSUIR' }],
        }}
      />,
    );

    const education = screen.getByRole('button', { name: /education/i });
    expect(education).toHaveTextContent(/Complete/);
    expect(education).not.toHaveTextContent(/Incomplete/);
  });

  it('exposes the selected section with aria-current or aria-pressed', () => {
    renderWithProviders(
      <CvSectionRail value="skills" onChange={() => {}} content={cvContentFixture} />,
    );

    const selected = screen.getByRole('button', { name: /skills/i });
    const ariaCurrent = selected.getAttribute('aria-current');
    const ariaPressed = selected.getAttribute('aria-pressed');

    expect(ariaCurrent === 'step' || ariaPressed === 'true').toBe(true);
  });
});
