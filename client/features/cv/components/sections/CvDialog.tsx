import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
};

const CvDialog = ({
  open,
  onClose,
  onDelete,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('cv.confirmDeleteLink')}</DialogTitle>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>

        <Button variant="contained" color="error" onClick={onDelete}>
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CvDialog;
