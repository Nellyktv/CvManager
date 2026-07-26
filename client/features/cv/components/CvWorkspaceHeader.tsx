import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import { isCvComplete } from '../../../shared/utils/cvCompletion';
import type { CvExportStatus } from '../hooks/useCvExport';
import CvTemplatePicker from './CvTemplatePicker';

type Props = {
  title: string;
  status: string;
  templateKey: CvTemplateKey;
  content: CvContent;
  canEdit: boolean;
  saving: boolean;
  isSaved?: boolean;
  saveError?: string | null;
  actionError?: string | null;
  pdfExportStatus?: CvExportStatus;
  pdfExportError?: string | null;
  onTemplateChange: (next: CvTemplateKey) => void;
  onRefreshClick: () => void;
  onPublish: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onRetrySave?: () => void;
  onRetryPdfExport?: () => void;
};

const completionMessages = (content: CvContent, t: (key: string) => string) => {
  const messages: string[] = [];
  if (!content.contact.name.trim()) messages.push(t('cv.completionMissingName'));
  if (!content.contact.email?.trim()) messages.push(t('cv.completionMissingEmail'));
  if (!content.education.some((entry) => entry.institution.trim())) {
    messages.push(t('cv.completionMissingEducation'));
  }
  return messages;
};

const CvWorkspaceHeader = ({
  title,
  status,
  templateKey,
  content,
  canEdit,
  saving,
  isSaved = false,
  saveError,
  actionError,
  pdfExportStatus = 'idle',
  pdfExportError,
  onTemplateChange,
  onRefreshClick,
  onPublish,
  onPrint,
  onDownloadPdf,
  onRetrySave,
  onRetryPdfExport,
}: Props) => {
  const { t } = useTranslation();
  const complete = isCvComplete(content);
  const gaps = completionMessages(content, t);
  const published = status === 'published';
  const pdfGenerating = pdfExportStatus === 'generating';

  return (
    <Stack gap={2} sx={{ m: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={1.5}
      >
        <Stack gap={0.5}>
          <Typography variant="h4">{title || t('cv.workspaceTitle')}</Typography>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              color={published ? 'success' : 'default'}
              label={published ? t('cv.statusPublished') : t('cv.statusDraft')}
            />
            {saving && (
              <Typography variant="caption" color="text.secondary">
                {t('cv.saving')}
              </Typography>
            )}
            {!saving && !saveError && isSaved && canEdit && (
              <Typography variant="caption" color="text.secondary">
                {t('cv.saved')}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <CvTemplatePicker
            value={templateKey}
            onChange={onTemplateChange}
            disabled={!canEdit}
          />
          {canEdit && (
            <Button variant="outlined" onClick={onRefreshClick}>
              {t('cv.refreshFromProfile')}
            </Button>
          )}
          <Button variant="outlined" onClick={onPrint}>
            {t('cv.print')}
          </Button>
          <Button
            variant="outlined"
            onClick={onDownloadPdf}
            disabled={pdfGenerating}
          >
            {pdfGenerating ? t('cv.pdfGenerating') : t('cv.downloadPdf')}
          </Button>
          {canEdit && !published && (
            <Button variant="contained" disabled={!complete} onClick={onPublish}>
              {t('cv.publish')}
            </Button>
          )}
        </Stack>
      </Stack>

      {saveError && (
        <Alert
          severity="error"
          action={
            onRetrySave ? (
              <Button color="inherit" size="small" onClick={onRetrySave}>
                {t('cv.retrySave')}
              </Button>
            ) : undefined
          }
        >
          {saveError}
        </Alert>
      )}

      {actionError && <Alert severity="error">{actionError}</Alert>}

      {pdfExportStatus === 'error' && pdfExportError && (
        <Alert
          severity="error"
          action={
            onRetryPdfExport ? (
              <Button color="inherit" size="small" onClick={onRetryPdfExport}>
                {t('cv.pdfRetry')}
              </Button>
            ) : undefined
          }
        >
          {pdfExportError}
        </Alert>
      )}

      {!canEdit && (
        <Alert severity="info">{t('cv.readOnlyHint')}</Alert>
      )}

      {canEdit && !complete && (
        <Alert severity="warning">
          <Typography variant="body2" sx={{ mb: gaps.length ? 0.5 : 0 }}>
            {t('cv.publishHint')}
          </Typography>
          {gaps.map((message) => (
            <Typography key={message} variant="body2">
              {message}
            </Typography>
          ))}
        </Alert>
      )}
    </Stack>
  );
};

export default CvWorkspaceHeader;
