import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import i18n from '../../shared/i18n/translate';
import { renderWithProviders } from '../../test/renderWithProviders';
import { cvContentFixture } from './fixtures/cvContent.fixture';
import CvPage from './CvPage';

const useMediaQueryMock = vi.hoisted(() =>
  vi.fn((query: unknown) => {
    void query;
    return true;
  }),
);

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useMediaQuery: ((query: unknown) =>
      useMediaQueryMock(query)) as typeof actual.useMediaQuery,
  };
});

vi.mock('../../store/ThemeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: 'light' }),
}));

vi.mock('./hooks/useCvWorkspace', () => ({
  useCvWorkspace: () => ({
    cv: {
      id: 2,
      version: 1,
      status: 'draft',
      userId: 7,
      templateKey: 'editorial-sidebar',
      content: cvContentFixture,
      position: { id: 1, title: 'Frontend Engineer' },
      user: { id: 7, firstName: 'Artem', lastName: 'Ilyin' },
    },
    content: cvContentFixture,
    templateKey: 'editorial-sidebar',
    loading: false,
    error: null,
    saveError: null,
    actionError: null,
    saving: false,
    isSaved: true,
    canEdit: true,
    updateContent: vi.fn(),
    updateTemplate: vi.fn(),
    refresh: vi.fn(),
    publish: vi.fn(),
    reload: vi.fn(),
    retrySave: vi.fn(),
    retryAction: vi.fn(),
  }),
}));

vi.mock('./hooks/useCvExport', () => ({
  useCvExport: () => ({
    exportPdf: vi.fn(),
    status: 'idle',
    error: null,
  }),
}));

type Viewport = 'mobile' | 'md' | 'lg';

const viewportWidth: Record<Viewport, number> = {
  mobile: 600,
  md: 960,
  lg: 1280,
};

const setViewport = (viewport: Viewport) => {
  useMediaQueryMock.mockImplementation((query: unknown) => {
    const match = String(query).match(/min-width:\s*(\d+)/i);
    if (!match) return false;
    return viewportWidth[viewport] >= Number(match[1]);
  });
};

const renderCvPage = (route = '/cv/2') =>
  renderWithProviders(
    <Routes>
      <Route path="/cv/:id" element={<CvPage />} />
    </Routes>,
    { route },
  );

beforeEach(() => {
  setViewport('lg');
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  useMediaQueryMock.mockReset();
  setViewport('lg');
});

describe('CvPage workspace layout', () => {
  it('shows section rail and highlights the matching preview section on desktop', async () => {
    const user = userEvent.setup();
    renderCvPage();

    expect(screen.getByRole('navigation', { name: /cv sections/i })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /projects/i }));

    expect(screen.getByTestId('cv-preview-projects')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(screen.getByTestId('cv-preview-contact')).not.toHaveAttribute(
      'data-highlighted',
      'true',
    );
  });

  it('keeps only Editor/Preview tabs on mobile with section rail inside the editor panel', async () => {
    setViewport('mobile');
    const user = userEvent.setup();
    renderCvPage();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole('tab', { name: /editor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
    expect(screen.queryByTestId('cv-workspace')).not.toBeInTheDocument();

    const editorPanel = document.getElementById('cv-workspace-editor-panel');
    expect(editorPanel).not.toBeNull();
    const rail = within(editorPanel as HTMLElement).getByRole('navigation', {
      name: /cv sections/i,
    });
    expect(rail).toBeVisible();

    await user.click(
      within(editorPanel as HTMLElement).getByRole('button', { name: /skills/i }),
    );

    await user.click(screen.getByRole('tab', { name: /preview/i }));

    expect(screen.getByTestId('cv-preview-skills')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
  });

  it('keeps rail, editor, and preview panes visible together on lg without tabs', () => {
    setViewport('lg');
    renderCvPage();

    const editorPane = screen.getByTestId('cv-editor-pane');
    const previewPane = screen.getByTestId('cv-preview-pane');
    const rail = screen.getByRole('navigation', { name: /cv sections/i });

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('cv-workspace')).toBeVisible();
    expect(editorPane).toBeVisible();
    expect(previewPane).toBeVisible();
    expect(rail).toBeVisible();
    expect(editorPane.contains(rail)).toBe(false);
  });

  it('nests the section rail inside the editor pane on md without tabs', () => {
    setViewport('md');
    renderCvPage();

    const editorPane = screen.getByTestId('cv-editor-pane');
    const previewPane = screen.getByTestId('cv-preview-pane');
    const rail = within(editorPane).getByRole('navigation', {
      name: /cv sections/i,
    });

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(editorPane).toBeVisible();
    expect(previewPane).toBeVisible();
    expect(rail).toBeVisible();
  });

  it('switches the focused editor section without changing CV contact data', async () => {
    const user = userEvent.setup();
    renderCvPage();

    expect(screen.getByDisplayValue('Artem Ilyin')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /education/i }));

    expect(screen.getByDisplayValue('Artem Ilyin')).not.toBeVisible();
    expect(screen.getByDisplayValue('BSUIR')).toBeVisible();
  });

  it('scrolls the highlighted preview section into view when rail selection changes', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      renderCvPage();
      scrollIntoView.mockClear();

      await user.click(screen.getByRole('button', { name: /projects/i }));

      expect(scrollIntoView).toHaveBeenCalled();
      const projects = screen.getByTestId('cv-preview-projects');
      expect(scrollIntoView.mock.instances).toContain(projects);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('keeps md section selection and preview highlight without tabs', async () => {
    setViewport('md');
    const user = userEvent.setup();
    renderCvPage();

    const editorPane = screen.getByTestId('cv-editor-pane');
    await user.click(
      within(editorPane).getByRole('button', { name: /projects/i }),
    );

    expect(screen.getByTestId('cv-preview-projects')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(screen.getByDisplayValue('CV Manager')).toBeVisible();
  });
});
