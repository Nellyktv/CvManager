import { type ReactNode, type SyntheticEvent } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvWorkspaceTab } from '../CvPage.constants';

type Props = {
  value: CvWorkspaceTab;
  onChange: (next: CvWorkspaceTab) => void;
  editor: ReactNode;
  preview: ReactNode;
};

const EDITOR_TAB_ID = 'cv-workspace-editor-tab';
const PREVIEW_TAB_ID = 'cv-workspace-preview-tab';
const EDITOR_PANEL_ID = 'cv-workspace-editor-panel';
const PREVIEW_PANEL_ID = 'cv-workspace-preview-panel';

const CvMobileTabs = ({ value, onChange, editor, preview }: Props) => {
  const { t } = useTranslation();

  const handleChange = (_event: SyntheticEvent, next: CvWorkspaceTab) => {
    onChange(next);
  };

  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        selectionFollowsFocus
        aria-label={t('cv.workspaceTitle')}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        <Tab
          id={EDITOR_TAB_ID}
          aria-controls={EDITOR_PANEL_ID}
          label={t('cv.editorTab')}
          value="editor"
        />
        <Tab
          id={PREVIEW_TAB_ID}
          aria-controls={PREVIEW_PANEL_ID}
          label={t('cv.previewTab')}
          value="preview"
        />
      </Tabs>
      <Box
        id={EDITOR_PANEL_ID}
        role="tabpanel"
        aria-labelledby={EDITOR_TAB_ID}
        hidden={value !== 'editor'}
        sx={{ p: 1, overflowX: 'hidden' }}
      >
        {editor}
      </Box>
      <Box
        id={PREVIEW_PANEL_ID}
        role="tabpanel"
        aria-labelledby={PREVIEW_TAB_ID}
        hidden={value !== 'preview'}
        sx={{ p: 1, overflow: 'auto' }}
      >
        {preview}
      </Box>
    </Box>
  );
};

export default CvMobileTabs;
