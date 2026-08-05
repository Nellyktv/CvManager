import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/axios.api';

interface SalesforceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPhone?: string;
}

export function SalesforceDialog({ open, onClose, onSuccess, defaultPhone }: SalesforceDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    phone: defaultPhone || '',
    website: '',
    industry: '',
    additionalInfo: '',
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, phone: defaultPhone || prev.phone }));
    }
  }, [open, defaultPhone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.phone) {
      enqueueSnackbar(t('common.requiredFieldsError'), { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/salesforce/sync-user', form);

      enqueueSnackbar(t('profile.salesforceSyncSuccess'), { variant: 'success' });
      onSuccess();
      onClose();
      setForm({
        companyName: '',
        phone: defaultPhone || '',
        website: '',
        industry: '',
        additionalInfo: '',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('profile.salesforceSyncError');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile.salesforceDialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 2 }}>
          <TextField
            label={t('profile.salesforceCompanyName')}
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            fullWidth
            disabled={loading}
          />
          <TextField
            label={t('profile.phone')}
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            fullWidth
            disabled={loading}
          />
          <TextField
            label={t('profile.salesforceWebsite')}
            name="website"
            value={form.website}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
          <TextField
            label={t('profile.salesforceIndustry')}
            name="industry"
            value={form.industry}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
          <TextField
            label={t('profile.salesforceAdditionalInfo')}
            name="additionalInfo"
            value={form.additionalInfo}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('profile.salesforceSyncing') : t('profile.salesforceSync')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
