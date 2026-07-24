import { useCallback, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import { cvDocumentLocale } from '../preview/cvDocumentLocale';
import { buildCvPdfFileName, downloadCvPdf } from '../pdf/downloadCvPdf';

export type CvExportStatus = 'idle' | 'generating' | 'success' | 'error';

export type ExportPdfArgs = {
  templateKey: CvTemplateKey;
  content: CvContent;
  positionTitle?: string;
};

export const useCvExport = () => {
  const { t, i18n } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [status, setStatus] = useState<CvExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(
    async ({ templateKey, content, positionTitle }: ExportPdfArgs) => {
      setStatus('generating');
      setError(null);

      const fileName = buildCvPdfFileName(content.contact.name, positionTitle);
      const locale = cvDocumentLocale(i18n.language);
      const labels = {
        contact: t('cv.documentContact'),
        skills: t('cv.documentSkills'),
        education: t('cv.documentEducation'),
        projects: t('cv.documentProjects'),
      };

      try {
        await downloadCvPdf({ templateKey, content, fileName, labels, locale });
        setStatus('success');
        enqueueSnackbar(t('cv.pdfSuccess'), { variant: 'success' });
      } catch {
        setStatus('error');
        setError(t('cv.pdfError'));
      }
    },
    [enqueueSnackbar, i18n.language, t],
  );

  return { exportPdf, status, error };
};
