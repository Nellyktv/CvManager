import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { EducationFormValues } from '../ProfilePage.constants';

type Props = {
  open: boolean;
  editId: number | null;
  form: EducationFormValues;
  onChange: (form: EducationFormValues) => void;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
};

const EducationFormDialog = ({
  open,
  editId,
  form,
  onChange,
  onClose,
  onSave,
  saving = false,
}: Props) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.institution.trim()) {
      setError(t('profile.institutionRequired'));
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError(t('profile.invalidDateRange'));
      return;
    }

    setError(null);
    await onSave();
  };

  const handleClose = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editId ? t('profile.editEducation') : t('profile.newEducation')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t('profile.institution')}
            value={form.institution}
            onChange={(e) => onChange({ ...form, institution: e.target.value })}
            required
          />

          <TextField
            label={t('profile.degree')}
            value={form.degree}
            onChange={(e) => onChange({ ...form, degree: e.target.value })}
          />

          <TextField
            label={t('profile.field')}
            value={form.field}
            onChange={(e) => onChange({ ...form, field: e.target.value })}
          />

          <TextField
            label={t('profile.educationLocation')}
            value={form.location}
            onChange={(e) => onChange({ ...form, location: e.target.value })}
          />

          <Stack direction="row" gap={2}>
            <TextField
              label={t('profile.startDate')}
              type="date"
              value={form.startDate}
              onChange={(e) => onChange({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={t('profile.endDate')}
              type="date"
              value={form.endDate}
              onChange={(e) => onChange({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <TextField
            label={t('profile.educationDescription')}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            multiline
            minRows={2}
          />

          <TextField
            label={t('profile.displayOrder')}
            type="number"
            value={form.displayOrder}
            onChange={(e) => onChange({ ...form, displayOrder: e.target.value })}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EducationFormDialog;
