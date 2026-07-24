import { useState } from 'react';
import { Box, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useParams } from 'react-router';

import type { CvSection } from '../../api/cv.api';
import CvEditorPanel from './components/CvEditorPanel';
import CvLoadError from './components/CvLoadError';
import CvMobileTabs from './components/CvMobileTabs';
import CvPreviewPanel from './components/CvPreviewPanel';
import CvSectionRail from './components/CvSectionRail';
import CvWorkspaceHeader from './components/CvWorkspaceHeader';
import RefreshFromProfileDialog from './components/RefreshFromProfileDialog';
import { useCvExport } from './hooks/useCvExport';
import { useCvWorkspace } from './hooks/useCvWorkspace';
import type { CvEditorSection, CvWorkspaceTab } from './CvPage.constants';

const CvPage = () => {
  const { id } = useParams();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const {
    cv,
    content,
    templateKey,
    loading,
    error,
    saveError,
    actionError,
    saving,
    isSaved,
    canEdit,
    updateContent,
    updateTemplate,
    refresh,
    publish,
    reload,
    retrySave,
    retryAction,
  } = useCvWorkspace(id);

  const {
    exportPdf,
    status: pdfExportStatus,
    error: pdfExportError,
  } = useCvExport();

  const [mobileTab, setMobileTab] = useState<CvWorkspaceTab>('editor');
  const [activeSection, setActiveSection] = useState<CvEditorSection>('contact');
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (loading) {
    return (
      <Stack gap={2} sx={{ m: 1 }}>
        <Skeleton variant="text" height={48} width="40%" />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={360} />
      </Stack>
    );
  }

  if (error && !cv) {
    return <CvLoadError onRetry={() => void reload()} />;
  }

  if (!cv || !content) {
    return <CvLoadError onRetry={() => void reload()} />;
  }

  const editor = (
    <CvEditorPanel
      content={content}
      onChange={updateContent}
      activeSection={activeSection}
      disabled={!canEdit}
    />
  );

  const preview = (
    <CvPreviewPanel
      templateKey={templateKey}
      content={content}
      highlightedSection={activeSection}
    />
  );

  const handleRefreshConfirm = async (sections: CvSection[]) => {
    setRefreshing(true);
    const ok = await refresh(sections);
    setRefreshing(false);
    if (ok) setRefreshOpen(false);
  };

  const rail = (orientation: 'vertical' | 'horizontal') => (
    <CvSectionRail
      value={activeSection}
      onChange={setActiveSection}
      content={content}
      orientation={orientation}
    />
  );

  return (
    <Box
      data-testid="cv-page-shell"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: { md: 'hidden' },
      }}
    >
      <Box
        data-testid="cv-page-header"
        sx={{
          flexShrink: 0,
          bgcolor: 'background.default',
        }}
      >
        <CvWorkspaceHeader
          title={cv.position.title}
          status={cv.status}
          templateKey={templateKey}
          content={content}
          canEdit={canEdit}
          saving={saving}
          isSaved={isSaved}
          saveError={saveError}
          actionError={actionError}
          onTemplateChange={updateTemplate}
          onRefreshClick={() => setRefreshOpen(true)}
          onPublish={() => void publish()}
          onPrint={() => window.print()}
          pdfExportStatus={pdfExportStatus}
          pdfExportError={pdfExportError}
          onDownloadPdf={() => {
            void exportPdf({
              templateKey,
              content,
              positionTitle: cv.position.title,
            });
          }}
          onRetryPdfExport={() => {
            void exportPdf({
              templateKey,
              content,
              positionTitle: cv.position.title,
            });
          }}
          onRetrySave={saveError ? () => void retrySave() : undefined}
          onRetryAction={actionError ? () => void retryAction() : undefined}
        />
      </Box>

      {isMdUp ? (
        <Box
          data-testid="cv-workspace"
          sx={{
            display: 'grid',
            gridTemplateColumns: isLgUp
              ? 'minmax(0, 176px) minmax(0, 1fr) minmax(0, 1.2fr)'
              : 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 2,
            px: 1,
            pb: 1,
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {isLgUp ? (
            <Box sx={{ alignSelf: 'start', minWidth: 0 }}>{rail('vertical')}</Box>
          ) : null}
          <Box
            data-testid="cv-editor-pane"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              overflow: 'auto',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {!isLgUp ? rail('horizontal') : null}
            {editor}
          </Box>
          <Box
            data-testid="cv-preview-pane"
            sx={{ overflow: 'auto', minHeight: 0, minWidth: 0 }}
          >
            {preview}
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto' }}>
          <CvMobileTabs
            value={mobileTab}
            onChange={setMobileTab}
            editor={
              <Stack gap={1}>
                {rail('horizontal')}
                {editor}
              </Stack>
            }
            preview={preview}
          />
        </Box>
      )}

      <RefreshFromProfileDialog
        key={refreshOpen ? 'refresh-open' : 'refresh-closed'}
        open={refreshOpen}
        onClose={() => setRefreshOpen(false)}
        onConfirm={handleRefreshConfirm}
        confirming={refreshing}
      />
    </Box>
  );
};

export default CvPage;
