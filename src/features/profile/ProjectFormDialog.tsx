import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  editId: number | null;
  titleValue: string;
  onTitleChange: (value: string) => void;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const ProjectFormDialog = ({
  open,
  editId,
  titleValue,
  onTitleChange,
  descriptionValue,
  onDescriptionChange,
  onClose,
  onSave,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editId ? t('profile.editProject') : t('profile.newProject')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('profile.projectTitle')}
            value={titleValue}
            onChange={(e) => onTitleChange(e.target.value)}
          />

          <TextField
            label={t('profile.projectDescription')}
            value={descriptionValue}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>

        <Button variant="contained" onClick={onSave}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectFormDialog;
