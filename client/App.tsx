
import { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import AppRouter from './routes/AppRouter';
import { useThemeStore } from './store/ThemeStore';
import { createAppTheme } from './theme';

import './App.css';

function App() {
  const mode = useThemeStore((state) => state.theme);
  const theme = useMemo(() => createAppTheme(mode), [mode]);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarProvider
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <AppRouter />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;