import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import CvProjectsSectionEditor from './CvProjectsSectionEditor';

vi.mock('../../../../store/ThemeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: 'light' }),
}));

describe('CvProjectsSectionEditor', () => {
  it('reuses the restricted MarkdownProjectEditor from Task 6', () => {
    renderWithProviders(
      <CvProjectsSectionEditor
        projects={[
          {
            title: 'CV Manager',
            links: [],
            descriptionMarkdown: '**bold**',
          },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText(/^bold$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^italic$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unordered list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^link$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^ordered list$/i)).not.toBeInTheDocument();
  });

  it('reorders projects with accessible up/down controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvProjectsSectionEditor
        projects={[
          { title: 'Alpha', links: [] },
          { title: 'Beta', links: [] },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /move down/i })[0]);

    expect(onChange).toHaveBeenCalledWith([
      { title: 'Beta', links: [] },
      { title: 'Alpha', links: [] },
    ]);
  });

  it('does not insert empty project link placeholders into autosaved snapshot data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvProjectsSectionEditor
        projects={[{ title: 'CV Manager', links: [] }]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add link/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/link label/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link url/i)).toBeInTheDocument();
  });
});
