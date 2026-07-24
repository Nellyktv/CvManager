import { createElement, type ReactElement } from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';

import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import CvPdfRouter, { type CvPdfLabels } from './CvPdfRouter';

export type DownloadCvPdfOptions = {
  templateKey: CvTemplateKey;
  content: CvContent;
  fileName: string;
  labels?: CvPdfLabels;
  locale?: 'en' | 'ru';
};

const DEFAULT_LABELS: CvPdfLabels = {
  contact: 'Contact',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
};

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the browser has a chance to start the download.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};

export const downloadCvPdf = async ({
  templateKey,
  content,
  fileName,
  labels = DEFAULT_LABELS,
  locale = 'en',
}: DownloadCvPdfOptions): Promise<void> => {
  const document = createElement(CvPdfRouter, {
    templateKey,
    content,
    labels,
    locale,
  }) as ReactElement<DocumentProps>;
  const instance = pdf(document);
  const blob = await instance.toBlob();
  triggerBrowserDownload(blob, fileName);
};

/** Build a filesystem-safe PDF name from owner + position. */
export const buildCvPdfFileName = (ownerName: string, positionTitle?: string): string => {
  const slug = (value: string) =>
    value
      .toLowerCase()
      // Keep Unicode letters/numbers; collapse everything else (paths, controls, spaces).
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');

  const parts = [slug(ownerName), positionTitle ? slug(positionTitle) : '']
    .filter(Boolean);
  return `${parts.join('-') || 'cv'}.pdf`;
};
