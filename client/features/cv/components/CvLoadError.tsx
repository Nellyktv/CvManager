import { Alert, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { CV_LIST_ROUTE } from '../../../shared/utils/constsLinks';

type Props = {
  onRetry: () => void;
};

const CvLoadError = ({ onRetry }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Stack gap={2} sx={{ m: 2, maxWidth: 480 }}>
      <Alert severity="error">{t('cv.loadError')}</Alert>
      <Stack direction="row" gap={1}>
        <Button variant="contained" onClick={onRetry}>
          {t('cv.loadErrorRetry')}
        </Button>
        <Button variant="outlined" onClick={() => navigate(CV_LIST_ROUTE)}>
          {t('cv.backToCvs')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default CvLoadError;
