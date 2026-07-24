import { Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import type { CvEducation } from '../../../../shared/types/cv';
import { moveItem } from '../../../../shared/utils/moveItem';

type Props = {
  education: CvEducation[];
  onChange: (education: CvEducation[]) => void;
  disabled?: boolean;
};

const emptyEducation = (): CvEducation => ({
  institution: '',
});

const CvEducationSectionEditor = ({
  education,
  onChange,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();

  const updateEntry = (index: number, patch: Partial<CvEducation>) => {
    onChange(education.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    onChange([...education, emptyEducation()]);
  };

  const removeEntry = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <Stack gap={2}>
      <Typography variant="h6">{t('cv.documentEducation')}</Typography>

      {education.map((entry, index) => (
        <Stack
          key={index}
          gap={1.5}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">
              {entry.institution || t('cv.addEducation')}
            </Typography>
            <Stack direction="row">
              <IconButton
                aria-label={t('cv.moveUp')}
                onClick={() => onChange(moveItem(education, index, -1))}
                disabled={disabled || index === 0}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                aria-label={t('cv.moveDown')}
                onClick={() => onChange(moveItem(education, index, 1))}
                disabled={disabled || index === education.length - 1}
              >
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton
                aria-label={t('cv.removeItem')}
                onClick={() => removeEntry(index)}
                disabled={disabled}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>
          <TextField
            label={t('profile.institution')}
            value={entry.institution}
            onChange={(e) => updateEntry(index, { institution: e.target.value })}
            disabled={disabled}
            required
          />
          <TextField
            label={t('profile.degree')}
            value={entry.degree ?? ''}
            onChange={(e) => updateEntry(index, { degree: e.target.value })}
            disabled={disabled}
          />
          <TextField
            label={t('profile.field')}
            value={entry.field ?? ''}
            onChange={(e) => updateEntry(index, { field: e.target.value })}
            disabled={disabled}
          />
          <TextField
            label={t('profile.educationLocation')}
            value={entry.location ?? ''}
            onChange={(e) => updateEntry(index, { location: e.target.value })}
            disabled={disabled}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField
              label={t('profile.startDate')}
              type="date"
              value={entry.startDate ?? ''}
              onChange={(e) => updateEntry(index, { startDate: e.target.value })}
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label={t('profile.endDate')}
              type="date"
              value={entry.endDate ?? ''}
              onChange={(e) => updateEntry(index, { endDate: e.target.value })}
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
          <TextField
            label={t('profile.educationDescription')}
            value={entry.description ?? ''}
            onChange={(e) => updateEntry(index, { description: e.target.value })}
            disabled={disabled}
            multiline
            minRows={2}
          />
        </Stack>
      ))}

      <Button onClick={addEntry} disabled={disabled} sx={{ alignSelf: 'flex-start' }}>
        {t('cv.addEducation')}
      </Button>
    </Stack>
  );
};

export default CvEducationSectionEditor;
