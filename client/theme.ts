import { alpha, createTheme, responsiveFontSizes, type PaletteMode } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';

const brand = {
  main: '#4F46E5',
  light: '#818CF8',
  dark: '#3730A3',
};

const accent = {
  main: '#14B8A6',
  light: '#5EEAD4',
  dark: '#0F766E',
};

const surfaces = {
  light: {
    default: '#F6F7FB',
    paper: '#FFFFFF',
    border: '#E4E7EF',
    text: '#0F172A',
    muted: '#64748B',
  },
  dark: {
    default: '#0B1020',
    paper: '#121829',
    border: '#232B42',
    text: '#E2E8F0',
    muted: '#94A3B8',
  },
};

export const brandGradient = `linear-gradient(135deg, ${brand.main} 0%, #7C3AED 55%, ${accent.main} 100%)`;

export const createAppTheme = (mode: PaletteMode) => {
  const s = surfaces[mode];
  const isDark = mode === 'dark';

  const theme = createTheme({
    palette: {
      mode,
      primary: isDark ? { main: brand.light, light: '#A5B4FC', dark: brand.main } : brand,
      secondary: isDark ? { main: accent.light, light: '#99F6E4', dark: accent.main } : accent,
      background: { default: s.default, paper: s.paper },
      text: { primary: s.text, secondary: s.muted },
      divider: s.border,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            WebkitTextSizeAdjust: '100%',
            textSizeAdjust: '100%',
          },
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            overflowX: 'hidden',
          },
          '::selection': { backgroundColor: alpha(brand.main, 0.2) },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: s.border },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${s.border}`,
            borderRadius: 16,
            transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 16 },
          containedPrimary: {
            backgroundImage: `linear-gradient(135deg, ${brand.main}, #6D28D9)`,
            color: '#FFFFFF',
            '&:hover': { backgroundImage: `linear-gradient(135deg, ${brand.dark}, #5B21B6)` },
            '&.Mui-disabled': { backgroundImage: 'none' },
          },
          sizeLarge: { paddingBlock: 10 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? alpha('#FFFFFF', 0.02) : '#FFFFFF',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(brand.main, 0.5) },
          },
          notchedOutline: { borderColor: s.border },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
          filled: {
            backgroundColor: alpha(brand.main, isDark ? 0.18 : 0.08),
            color: isDark ? '#C7D2FE' : brand.dark,
            '&.MuiChip-clickable:hover': { backgroundColor: alpha(brand.main, isDark ? 0.28 : 0.16) },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor: alpha(brand.main, isDark ? 0.2 : 0.1),
              color: isDark ? '#C7D2FE' : brand.dark,
              '& .MuiListItemIcon-root': { color: 'inherit' },
              '&:hover': { backgroundColor: alpha(brand.main, isDark ? 0.26 : 0.14) },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: { root: { minWidth: 40 } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderColor: s.border, backgroundColor: s.paper },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(s.paper, 0.85),
            WebkitBackdropFilter: 'saturate(180%) blur(12px)',
            backdropFilter: 'saturate(180%) blur(12px)',
            '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
              backgroundColor: s.paper,
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          colorDefault: {
            backgroundColor: alpha(brand.main, isDark ? 0.24 : 0.12),
            color: isDark ? '#C7D2FE' : brand.dark,
            fontWeight: 600,
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 8, fontSize: 12 } },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            '--DataGrid-rowBorderColor': s.border,
            '--DataGrid-containerBackground': isDark ? alpha('#FFFFFF', 0.03) : '#F8FAFC',
          },
          columnHeaderTitle: { fontWeight: 600 },
          columnSeparator: { display: 'none' },
          row: {
            '&:hover': { backgroundColor: alpha(brand.main, isDark ? 0.08 : 0.04) },
          },
          cell: {
            '&:focus, &:focus-within': { outline: 'none' },
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme);
};
