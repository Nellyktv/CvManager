import { Box, IconButton, MenuItem, Select, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useThemeStore } from '../../store/ThemeStore';
import { LOGIN_ROUTE, REGISTER_ROUTE } from '../../shared/utils/constsLinks';

type AuthPageProps = {
  loginPage?: boolean;
};

const AuthPage = ({ loginPage }: AuthPageProps) => {
  const { t, i18n } = useTranslation();
  const mode = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleTheme);
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Stack direction="row" alignItems="center" gap={1}>
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
      </Box>

      {loginPage ? (
        <LoginForm
          title={t('auth.loginTitle')}
          btnName={t('auth.signIn')}
          textForLink={t('auth.noAccount')}
          linkName={t('auth.register')}
          linkTo={REGISTER_ROUTE}
        />
      ) : (
        <SignupForm
          title={t('auth.signupTitle')}
          btnName={t('auth.signUp')}
          textForLink={t('auth.haveAccount')}
          linkName={t('auth.login')}
          linkTo={LOGIN_ROUTE}
        />
      )}
    </Stack>
  );
};

export default AuthPage;
