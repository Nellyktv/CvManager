import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import CvMobileTabs from './CvMobileTabs';

describe('CvMobileTabs', () => {
  it('switches editor and preview panels with keyboard navigation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvMobileTabs
        value="editor"
        onChange={onChange}
        editor={<div>Editor panel body</div>}
        preview={<div>Preview panel body</div>}
      />,
    );

    expect(screen.getByText('Editor panel body')).toBeInTheDocument();

    const previewTab = screen.getByRole('tab', { name: /preview/i });
    previewTab.focus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('preview');
  });

  it('supports arrow-key movement between tabs', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvMobileTabs
        value="editor"
        onChange={onChange}
        editor={<div>Editor panel body</div>}
        preview={<div>Preview panel body</div>}
      />,
    );

    const editorTab = screen.getByRole('tab', { name: /editor/i });
    editorTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith('preview');
  });

  it('wires tab/tabpanel ARIA relationships and keeps both panels mounted', () => {
    renderWithProviders(
      <CvMobileTabs
        value="editor"
        onChange={() => {}}
        editor={<div>Editor panel body</div>}
        preview={<div>Preview panel body</div>}
      />,
    );

    const editorTab = screen.getByRole('tab', { name: /editor/i });
    const previewTab = screen.getByRole('tab', { name: /preview/i });
    const editorPanel = document.getElementById('cv-workspace-editor-panel');
    const previewPanel = document.getElementById('cv-workspace-preview-panel');

    expect(editorTab).toHaveAttribute('id', 'cv-workspace-editor-tab');
    expect(previewTab).toHaveAttribute('id', 'cv-workspace-preview-tab');
    expect(editorTab).toHaveAttribute('aria-controls', 'cv-workspace-editor-panel');
    expect(previewTab).toHaveAttribute('aria-controls', 'cv-workspace-preview-panel');

    expect(editorPanel).toHaveAttribute('role', 'tabpanel');
    expect(previewPanel).toHaveAttribute('role', 'tabpanel');
    expect(editorPanel).toHaveAttribute('aria-labelledby', 'cv-workspace-editor-tab');
    expect(previewPanel).toHaveAttribute('aria-labelledby', 'cv-workspace-preview-tab');

    expect(screen.getByText('Editor panel body')).toBeInTheDocument();
    expect(screen.getByText('Preview panel body')).toBeInTheDocument();
    expect(previewPanel).toHaveAttribute('hidden');
  });
});
