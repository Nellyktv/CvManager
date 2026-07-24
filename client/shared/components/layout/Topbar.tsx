import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Button,
} from '@mui/material';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useThemeStore } from '../../../store/ThemeStore';
import type { UserRole } from '../../../store/UserStore';
import { LOGIN_ROUTE } from '../../utils/constsLinks';

type TopbarProps = {
  onMenuClick: () => void;
  displayName: string;
  initials: string;
  email: string;
  role: UserRole | '';
  isAuth: boolean;
  onLogout: () => void;
};

const Topbar = ({
  onMenuClick,
  displayName,
  initials,
  email,
  role,
  isAuth,
  onLogout,
}: TopbarProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mode = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleTheme);
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <IconButton
          onClick={onMenuClick}
          sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="center" gap={{ xs: 0.5, sm: 2 }}>
          <Select
            size="small"
            value={currentLang}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            sx={{ minWidth: { xs: 64, sm: 80 } }}
          >
            <MenuItem value="en">EN</MenuItem>
            <MenuItem value="ru">RU</MenuItem>
          </Select>

          <IconButton onClick={toggleMode}>
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>

          {!isAuth && (
            <Button variant="contained" onClick={() => navigate(LOGIN_ROUTE)}>
              {t('auth.login')}
            </Button>
          )}

          {isAuth && (
            <>
              <Stack direction="row" alignItems="center" gap={1}>
                <Avatar>{initials}</Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2">
                    {displayName || email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {role && t(`roles.${role.toLowerCase()}`)}
                  </Typography>
                </Box>
              </Stack>

              <IconButton onClick={onLogout} title={t('common.logout')}>
                <LogoutOutlinedIcon />
              </IconButton>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
