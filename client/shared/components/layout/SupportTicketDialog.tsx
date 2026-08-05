import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { api } from '../../../api/axios.api';

interface SupportTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES = ['High', 'Average', 'Low'];

export function SupportTicketDialog({ open, onClose }: SupportTicketDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ summary: '', priority: '', position: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm({ summary: '', priority: '', position: '' });
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.summary || !form.priority) {
      enqueueSnackbar(t('common.requiredFieldsError'), { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/support-ticket', {
        ...form,
        link: window.location.href,
      });

      enqueueSnackbar(t('supportTicket.success'), { variant: 'success' });
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('supportTicket.error');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('supportTicket.dialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 2 }}>
          <TextField
            label={t('supportTicket.summary')}
            name="summary"
            value={form.summary}
            onChange={handleChange}
            required
            fullWidth
            multiline
            rows={3}
            disabled={loading}
          />
          <TextField
            select
            label={t('supportTicket.priority')}
            name="priority"
            value={form.priority}
            onChange={handleChange}
            required
            fullWidth
            disabled={loading}
          >
            {PRIORITIES.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {t(`supportTicket.priority${priority}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('supportTicket.position')}
            name="position"
            value={form.position}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {t('supportTicket.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
