import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import CvWorkspaceHeader from './CvWorkspaceHeader';

const baseProps = {
  title: 'Frontend Engineer',
  status: 'draft',
  templateKey: 'editorial-sidebar' as const,
  content: cvContentFixture,
  canEdit: true,
  saving: false,
  isSaved: false,
  onTemplateChange: () => {},
  onRefreshClick: () => {},
  onPublish: () => {},
  onPrint: () => {},
  onDownloadPdf: () => {},
};

describe('CvWorkspaceHeader', () => {
  it('disables Publish and announces what is missing for incomplete content', () => {
    const incomplete = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, email: '' },
      education: [],
    };

    renderWithProviders(
      <CvWorkspaceHeader {...baseProps} content={incomplete} />,
    );

    const publish = screen.getByRole('button', { name: /publish/i });
    expect(publish).toBeDisabled();
    expect(screen.getByText(/contact email is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/at least one education entry is required/i),
    ).toBeInTheDocument();
  });

  it('treats blank-institution education as incomplete for Publish', () => {
    const incomplete = {
      ...cvContentFixture,
      education: [{ institution: '   ' }],
    };

    renderWithProviders(
      <CvWorkspaceHeader {...baseProps} content={incomplete} />,
    );

    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    expect(
      screen.getByText(/at least one education entry is required/i),
    ).toBeInTheDocument();
  });

  it('does not show all changes saved until isSaved is true', () => {
    const { rerender } = renderWithProviders(
      <CvWorkspaceHeader {...baseProps} isSaved={false} />,
    );

    expect(screen.queryByText(/all changes saved/i)).not.toBeInTheDocument();

    rerender(<CvWorkspaceHeader {...baseProps} isSaved />);
    expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
  });

  it('retries action errors with Retry, not Retry save', async () => {
    const user = userEvent.setup();
    const onRetryAction = vi.fn();

    renderWithProviders(
      <CvWorkspaceHeader
        {...baseProps}
        actionError="Something went wrong"
        onRetryAction={onRetryAction}
      />,
    );

    expect(screen.queryByRole('button', { name: /retry save/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^retry$/i }));
    expect(onRetryAction).toHaveBeenCalledTimes(1);
  });

  it('disables Download PDF and shows generating label while exporting', () => {
    renderWithProviders(
      <CvWorkspaceHeader {...baseProps} pdfExportStatus="generating" />,
    );

    const download = screen.getByRole('button', { name: /generating pdf/i });
    expect(download).toBeDisabled();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
  });

  it('shows PDF export error with retry action', async () => {
    const user = userEvent.setup();
    const onRetryPdfExport = vi.fn();

    renderWithProviders(
      <CvWorkspaceHeader
        {...baseProps}
        pdfExportStatus="error"
        pdfExportError="Could not generate the PDF."
        onRetryPdfExport={onRetryPdfExport}
      />,
    );

    expect(screen.getByText(/could not generate the pdf/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^retry$/i }));
    expect(onRetryPdfExport).toHaveBeenCalledTimes(1);
  });

  it('keeps template selection as a compact header action, not permanent radiocards', async () => {
    const user = userEvent.setup();
    const onTemplateChange = vi.fn();

    renderWithProviders(
      <CvWorkspaceHeader {...baseProps} onTemplateChange={onTemplateChange} />,
    );

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    const template = screen.getByRole('button', { name: /template/i });
    expect(template).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh from profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();

    await user.click(template);
    await user.click(screen.getByRole('menuitemradio', { name: /structured minimal/i }));
    expect(onTemplateChange).toHaveBeenCalledWith('structured-minimal');
  });
});