import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import MarkdownProjectEditor from './MarkdownProjectEditor';

let mockTheme: 'light' | 'dark' = 'dark';

vi.mock('../../../store/ThemeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: mockTheme }),
}));

describe('MarkdownProjectEditor', () => {
  beforeEach(() => {
    mockTheme = 'dark';
  });

  it('renders a restricted toolbar with only bold, italic, list, and link', () => {
    renderWithProviders(
      <MarkdownProjectEditor value="**hello**" onChange={() => {}} />,
    );

    expect(screen.getByLabelText(/^bold$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^italic$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unordered list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^link$/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/^ordered list$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/code block/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/strikethrough/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/fullscreen/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/live code/i)).not.toBeInTheDocument();
  });

  it.each(['light', 'dark'] as const)(
    'follows ThemeStore %s color mode for the Markdown editor chrome',
    (theme) => {
      mockTheme = theme;
      const { container } = renderWithProviders(
        <MarkdownProjectEditor value="**hello**" onChange={() => {}} />,
      );

      expect(container.querySelector(`[data-color-mode="${theme}"]`)).toBeTruthy();
    },
  );

  it('exposes the markdown label to assistive tech', () => {
    renderWithProviders(
      <MarkdownProjectEditor value="**hello**" onChange={() => {}} />,
    );

    const label = screen
      .getAllByText('Project description')
      .find((node) => node.tagName === 'LABEL');

    expect(label).toBeTruthy();
    const editorId = label!.getAttribute('for');
    expect(editorId).toBeTruthy();

    const editor = document.getElementById(editorId!);
    expect(editor).toBeInstanceOf(HTMLTextAreaElement);
    expect(editor).toHaveAttribute('aria-labelledby', label!.id);
  });

  it('uses the restricted safe renderer for live preview, not HTML', () => {
    const { container } = renderWithProviders(
      <MarkdownProjectEditor
        value={'Built **fast** with <script>alert(1)</script>'}
        onChange={() => {}}
      />,
    );

    const preview = container.querySelector('.cv-md-safe-preview');
    expect(preview).toBeTruthy();
    expect(preview!.querySelector('strong')?.textContent).toBe('fast');
    expect(preview!.textContent).toMatch(/<script>alert\(1\)<\/script>/);
    expect(preview!.querySelector('script')).toBeNull();
    expect(document.querySelector('.wmde-markdown')).toBeNull();
  });
});

