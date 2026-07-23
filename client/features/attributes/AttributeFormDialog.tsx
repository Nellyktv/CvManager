import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { AttributeCategory, AttributeType } from './AttributesPage.constants';

type Props = {
  open: boolean;
  editId: number | null;
  nameValue: string;
  onNameChange: (value: string) => void;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  typeValue: string;
  typeOptions: AttributeType[];
  onTypeChange: (value: string) => void;
  categoryValue: string;
  categoryOptions: AttributeCategory[];
  onCategoryChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const AttributeFormDialog = ({
  open,
  editId,
  nameValue,
  onNameChange,
  descriptionValue,
  onDescriptionChange,
  typeValue,
  typeOptions,
  onTypeChange,
  categoryValue,
  categoryOptions,
  onCategoryChange,
  onClose,
  onSave,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editId ? t('attributes.editAttribute') : t('attributes.newAttribute')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('attributes.fieldName')}
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
          />

          <TextField
            label={t('attributes.fieldDescription')}
            value={descriptionValue}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />

          <TextField
            select
            label={t('attributes.fieldCategory')}
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categoryOptions.map((el) => (
              <MenuItem key={el} value={el}>
                {t(`attributes.category${el}`)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('attributes.fieldType')}
            value={typeValue}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            {typeOptions.map((el) => (
              <MenuItem key={el} value={el}>
                {t(`attributes.type${el}`)}
              </MenuItem>
            ))}
          </TextField>
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

export default AttributeFormDialog;
