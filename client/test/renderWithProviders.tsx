/* eslint-disable react-refresh/only-export-components -- test utility, not a hot-reloaded app module */
import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import i18n from '../shared/i18n/translate';

type ProvidersProps = {
  children: ReactNode;
  route?: string;
  mode?: 'light' | 'dark';
};

const Providers = ({ children, route = '/', mode = 'light' }: ProvidersProps) => {
  const theme = createTheme({ palette: { mode } });

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  mode?: 'light' | 'dark';
};

export const renderWithProviders = (
  ui: ReactElement,
  { route, mode, ...options }: RenderWithProvidersOptions = {},
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <Providers route={route} mode={mode}>
        {children}
      </Providers>
    ),
    ...options,
  });
