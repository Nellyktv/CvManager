import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PUBLIC_ROUTE } from '../../shared/utils/constsLinks';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
      gap={1}
    >
      <Typography variant="h1" fontWeight={700} color="text.secondary">
        404
      </Typography>
      <Typography variant="h5">{t('notFound.heading')}</Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={420}>
        {t('notFound.description')}
      </Typography>
      <Button component={Link} to={PUBLIC_ROUTE} variant="contained" sx={{ mt: 2 }}>
        {t('notFound.backHome')}
      </Button>
    </Stack>
  );
};

export default NotFoundPage;
