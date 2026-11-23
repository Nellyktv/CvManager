import { IconButton, Link, MenuItem, Select, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginForm from './LoginForm';
import { useThemeStore } from '../../store/ThemeStore';
import { brandGradient } from '../../theme';
import { PUBLIC_ROUTE } from '../../shared/utils/constsLinks';

const AuthPage = () => {
  const { t, i18n } = useTranslation();
  const mode = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleTheme);
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      p={2}
      gap={2}
      sx={{
        minHeight: '100vh',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        '&::before': {
          content: '""',
          position: 'absolute',
          zIndex: -1,
          width: { xs: 360, md: 640 },
          height: { xs: 360, md: 640 },
          top: { xs: -160, md: -260 },
          right: { xs: -160, md: -200 },
          borderRadius: '50%',
          background: brandGradient,
          opacity: 0.18,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        gap={1}
        sx={{ width: '100%', maxWidth: 420 }}
      >
        <Link
          component={RouterLink}
          to={PUBLIC_ROUTE}
          color="text.primary"
          underline="none"
          sx={{ '&:hover': { color: 'primary.main' } }}
        >
          {t('nav.dashboard')}
        </Link>

        <Select
          size="small"
          value={currentLang}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          <MenuItem value="en">EN</MenuItem>
          <MenuItem value="ru">RU</MenuItem>
        </Select>

        <IconButton onClick={toggleMode}>
          {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </IconButton>
      </Stack>

      <LoginForm />
    </Stack>
  );
};

export default AuthPage;
