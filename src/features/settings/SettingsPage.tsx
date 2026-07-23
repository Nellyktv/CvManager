import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

import { useTranslation } from 'react-i18next';

import { useThemeStore } from '../../store/ThemeStore';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const mode = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleTheme);
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

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
    </>
  );
};

export default SettingsPage;
