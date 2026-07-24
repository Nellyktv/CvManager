import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { I18nextProvider } from 'react-i18next';
import { createElement, type ReactNode } from 'react';

import i18n from '../../../shared/i18n/translate';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import { buildCvPdfFileName, downloadCvPdf } from './downloadCvPdf';
import { useCvExport } from '../hooks/useCvExport';

const toBlob = vi.hoisted(() => vi.fn());
const pdf = vi.hoisted(() => vi.fn());

vi.mock('@react-pdf/renderer', () => ({
  pdf: (...args: unknown[]) => pdf(...args),
  Document: ({ children }: { children?: ReactNode }) => children ?? null,
  Page: ({ children }: { children?: ReactNode }) => children ?? null,
  View: ({ children }: { children?: ReactNode }) => children ?? null,
  Text: ({ children }: { children?: ReactNode }) => children ?? null,
  Link: ({ children }: { children?: ReactNode }) => children ?? null,
  StyleSheet: { create: (styles: unknown) => styles },
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    I18nextProvider,
    { i18n },
    createElement(SnackbarProvider, null, children),
  );

describe('buildCvPdfFileName', () => {
  it('preserves Cyrillic letters in owner and position names', () => {
    expect(buildCvPdfFileName('Артём Ильин', 'Frontend Engineer')).toBe(
      'артём-ильин-frontend-engineer.pdf',
    );
    expect(buildCvPdfFileName('Иван Петров', 'Инженер')).toBe(
      'иван-петров-инженер.pdf',
    );
  });

  it('removes path separators and unsafe whitespace', () => {
    expect(buildCvPdfFileName('Art/em\\Ilyin', 'Front  Engineer')).toBe(
      'art-em-ilyin-front-engineer.pdf',
    );
  });
});

describe('downloadCvPdf', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    toBlob.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    pdf.mockReturnValue({ toBlob });

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-pdf'),
      revokeObjectURL: vi.fn(),
    });

    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    clickSpy.mockRestore();
    vi.useRealTimers();
  });

  it('generates a PDF blob for editorial-sidebar', async () => {
    await downloadCvPdf({
      templateKey: 'editorial-sidebar',
      content: cvContentFixture,
      fileName: 'artem-frontend-engineer.pdf',
    });

    expect(toBlob).toHaveBeenCalledOnce();
    expect(pdf).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('generates a PDF blob for structured-minimal', async () => {
    await downloadCvPdf({
      templateKey: 'structured-minimal',
      content: cvContentFixture,
      fileName: 'artem-frontend-engineer.pdf',
    });

    expect(toBlob).toHaveBeenCalledOnce();
    expect(pdf).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('revokes the blob URL asynchronously after download initiation', async () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-pdf'),
      revokeObjectURL,
    });

    await downloadCvPdf({
      templateKey: 'editorial-sidebar',
      content: cvContentFixture,
      fileName: 'artem-frontend-engineer.pdf',
    });

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-pdf');
  });
});

describe('useCvExport', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    toBlob.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    pdf.mockReturnValue({ toBlob });

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-pdf'),
      revokeObjectURL: vi.fn(),
    });

    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it('moves to error state when PDF generation fails and allows retry', async () => {
    toBlob.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useCvExport(), { wrapper });

    await act(async () => {
      await result.current.exportPdf({
        templateKey: 'editorial-sidebar',
        content: cvContentFixture,
        positionTitle: 'Frontend Engineer',
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();

    toBlob.mockResolvedValueOnce(new Blob(['pdf'], { type: 'application/pdf' }));

    await act(async () => {
      await result.current.exportPdf({
        templateKey: 'editorial-sidebar',
        content: cvContentFixture,
        positionTitle: 'Frontend Engineer',
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.error).toBeNull();
    expect(toBlob).toHaveBeenCalledTimes(2);
  });
});
