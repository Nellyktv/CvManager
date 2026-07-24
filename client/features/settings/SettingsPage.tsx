import { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  Divider,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';

import { useThemeStore } from '../../store/ThemeStore';
import useUserStore from '../../store/UserStore';
import { api } from '../../api/axios.api';
import { ChangePasswordSchema } from '../../shared/utils/shemas';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useUserStore((state) => state.user);
  const mode = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleTheme);
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChangePassword = async () => {
    const result = ChangePasswordSchema.safeParse({ newPassword, confirmPassword });

    if (!result.success) {
      enqueueSnackbar(t('settings.passwordMismatch'), { variant: 'error' });
      return;
    }

    try {
      await api.put(`/user/${currentUser.id}`, { password: newPassword });
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password', error);
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 560 }}>
        <Typography variant="h6" sx={{ m: 1 }}>
          {t('settings.preferences')}
        </Typography>

        <Stack direction="row" alignItems="center" sx={{ p: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">{t('settings.language')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.languageHint')}
            </Typography>
          </Box>
          <Select
            size="small"
            value={currentLang}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ru">Русский</MenuItem>
          </Select>
        </Stack>

        <Divider />

        <Stack direction="row" alignItems="center" sx={{ p: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">{t('settings.theme')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.themeHint')}
            </Typography>
          </Box>
          <Select
            size="small"
            value={mode}
            onChange={(e) => {
              if (e.target.value !== mode) toggleMode();
            }}
            sx={{ width: 160 }}
          >
            <MenuItem value="light">{t('settings.light')}</MenuItem>
            <MenuItem value="dark">{t('settings.dark')}</MenuItem>
          </Select>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 560 }}>
        <Typography variant="h6" sx={{ m: 1 }}>
          {t('settings.password')}
        </Typography>

        <Stack spacing={2} sx={{ p: 1 }}>
          <TextField
            type={showPassword ? 'text' : 'password'}
            label={t('settings.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            type={showPassword ? 'text' : 'password'}
            label={t('settings.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box>
            <Button variant="contained" onClick={handleChangePassword}>
              {t('settings.changePassword')}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </>
  );
};

export default SettingsPage;
