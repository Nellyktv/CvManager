import { type ReactNode } from 'react';
import { Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { cvDocumentLocale } from './cvDocumentLocale';

type CvDocumentFrameProps = {
  children: ReactNode;
};

/** Theme-aware workspace chrome around a forced-light A4 document surface. */
const CvDocumentFrame = ({ children }: CvDocumentFrameProps) => {
  const { i18n } = useTranslation();
  const lang = cvDocumentLocale(i18n.language);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        component="article"
        lang={lang}
        sx={{
          width: '100%',
          maxWidth: 794,
          // A4 proportions at ~96dpi; height grows with content past one page
          minHeight: 'calc(794px * 297 / 210)',
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          overflow: 'visible',
          // Document styles stay independent of app palette.mode
          '& a': {
            color: '#0b4f6c',
          },
          '& p': {
            margin: '0 0 0.65em',
            lineHeight: 1.45,
          },
          '& ul': {
            margin: '0 0 0.65em',
            paddingLeft: '1.2em',
          },
          '& li': {
            marginBottom: '0.25em',
            lineHeight: 1.4,
          },
          '& [data-highlighted="true"]': {
            outline: '2px solid #0b4f6c',
            outlineOffset: 3,
            backgroundColor: 'rgba(11, 79, 108, 0.06)',
            borderRadius: 2,
            transition:
              'background-color 160ms ease, outline-color 160ms ease, box-shadow 160ms ease',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
          },
          '& aside [data-highlighted="true"], & [data-highlight-surface="dark"][data-highlighted="true"]':
            {
              outlineColor: '#9ed0ea',
              backgroundColor: 'rgba(158, 208, 234, 0.16)',
              boxShadow: 'inset 0 0 0 1px rgba(248, 250, 252, 0.35)',
            },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default CvDocumentFrame;
