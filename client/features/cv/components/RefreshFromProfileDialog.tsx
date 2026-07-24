import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvSection } from '../../../api/cv.api';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (sections: CvSection[]) => void | Promise<void>;
  confirming?: boolean;
};

const SECTION_OPTIONS: Array<{ key: CvSection; labelKey: string }> = [
  { key: 'contact', labelKey: 'cv.refreshSectionContact' },
  { key: 'skills', labelKey: 'cv.refreshSectionSkills' },
  { key: 'education', labelKey: 'cv.refreshSectionEducation' },
  { key: 'projects', labelKey: 'cv.refreshSectionProjects' },
];

const emptySelection = (): Record<CvSection, boolean> => ({
  contact: false,
  skills: false,
  education: false,
  projects: false,
});

const RefreshFromProfileDialog = ({
  open,
  onClose,
  onConfirm,
  confirming = false,
}: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Record<CvSection, boolean>>(emptySelection);
  const [hint, setHint] = useState(false);

  const handleClose = () => {
    if (confirming) return;
    setSelected(emptySelection());
    setHint(false);
    onClose();
  };

  const toggle = (key: CvSection) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    setHint(false);
  };

  const handleConfirm = async () => {
    const sections = SECTION_OPTIONS.map((option) => option.key).filter(
      (key) => selected[key],
    );
    if (sections.length === 0) {
      setHint(true);
      return;
    }
    await onConfirm(sections);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('cv.refreshDialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <Alert severity="warning">{t('cv.refreshDialogWarning')}</Alert>
          <FormGroup>
            {SECTION_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    checked={selected[option.key]}
                    onChange={() => toggle(option.key)}
                    disabled={confirming}
                  />
                }
                label={t(option.labelKey)}
              />
            ))}
          </FormGroup>
          {hint && (
            <Typography variant="caption" color="error">
              {t('cv.refreshSelectHint')}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={confirming}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={confirming}>
          {t('cv.refreshConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefreshFromProfileDialog;
