import { useEffect } from 'react';
import { Box } from '@mui/material';

import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import type { CvEditorSection } from '../CvPage.constants';
import CvPreviewRouter from '../preview/CvPreviewRouter';

type Props = {
  templateKey: CvTemplateKey;
  content: CvContent;
  highlightedSection?: CvEditorSection;
};

const CvPreviewPanel = ({ templateKey, content, highlightedSection }: Props) => {
  useEffect(() => {
    if (!highlightedSection) return;
    const target = document.querySelector<HTMLElement>(
      `[data-testid="cv-preview-${highlightedSection}"]`,
    );
    if (typeof target?.scrollIntoView !== 'function') return;
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlightedSection]);

  return (
    <Box
      data-testid="cv-preview-panel"
      sx={{
        p: 1,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'visible',
        height: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <CvPreviewRouter
        templateKey={templateKey}
        content={content}
        highlightedSection={highlightedSection}
      />
    </Box>
  );
};

export default CvPreviewPanel;
