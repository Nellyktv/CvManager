import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { PositionCv } from './PositionPage.constants';

type Props = {
  open: boolean;
  cvs: PositionCv[];
  onClose: () => void;
};

const PositionCvsDialog = ({ open, cvs, onClose }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('positions.cvsForPosition')}</DialogTitle>

      <DialogContent>
        {cvs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('positions.noCvsForPosition')}
          </Typography>
        ) : (
          <List>
            {cvs.map((cv) => {
              const firstName = cv.user ? cv.user.firstName || '' : '';
              const lastName = cv.user ? cv.user.lastName || '' : '';
              const candidate = `${firstName} ${lastName}`.trim();

              return (
                <ListItemButton
                  key={cv.id}
                  divider
                  onClick={() => {
                    onClose();
                    navigate(`/cv/${cv.id}`);
                  }}
                >
                  <ListItemText
                    primary={candidate}
                    secondary={`CV #${cv.id} · v${cv.version}`}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionCvsDialog;