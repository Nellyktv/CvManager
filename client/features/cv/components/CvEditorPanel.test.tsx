import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import CvEditorPanel from './CvEditorPanel';

vi.mock('../../../store/ThemeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: 'light' }),
}));

describe('CvEditorPanel draft preservation', () => {
  it('preserves an in-progress contact link draft across active-section switches', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = renderWithProviders(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="contact"
      />,
    );

    const contactSection = screen.getByTestId('cv-editor-section-contact');
    await user.click(
      within(contactSection).getByRole('button', { name: /add link/i }),
    );
    const labels = within(contactSection).getAllByLabelText(/link label/i);
    await user.type(labels[labels.length - 1], 'WIP Contact Draft');

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="skills"
      />,
    );

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="contact"
      />,
    );

    expect(
      within(screen.getByTestId('cv-editor-section-contact')).getByDisplayValue(
        'WIP Contact Draft',
      ),
    ).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('preserves an in-progress project link draft across active-section switches', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = renderWithProviders(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="projects"
      />,
    );

    const projectsSection = screen.getByTestId('cv-editor-section-projects');
    await user.click(
      within(projectsSection).getAllByRole('button', { name: /add link/i })[0],
    );
    const labels = within(projectsSection).getAllByLabelText(/link label/i);
    await user.type(labels[labels.length - 1], 'WIP Project Draft');

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="contact"
      />,
    );

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <CvEditorPanel
        content={cvContentFixture}
        onChange={onChange}
        activeSection="projects"
      />,
    );

    expect(
      within(screen.getByTestId('cv-editor-section-projects')).getByDisplayValue(
        'WIP Project Draft',
      ),
    ).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });
});
