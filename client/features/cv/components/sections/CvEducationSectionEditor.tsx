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

const CvEducationSectionEditor = ({
  education,
  onChange,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();

  const updateField = (
    index: number,
    field: keyof CvEducation,
    value: string,
  ) => {
    const newEducation = [...education];

    newEducation[index] = {
      ...newEducation[index],
      [field]: value,
    };

    onChange(newEducation);
  };

  const addEducation = () => {
    onChange([
      ...education,
      {
        institution: '',
      },
    ]);
  };

  const deleteEducation = (index: number) => {
    const newEducation = education.filter((_, i) => i !== index);
    onChange(newEducation);
  };

  const moveUp = (index: number) => {
    onChange(moveItem(education, index, -1));
  };

  const moveDown = (index: number) => {
    onChange(moveItem(education, index, 1));
  };

  return (
    <Stack gap={2}>
      <Typography variant="h6">
        {t('cv.documentEducation')}
      </Typography>

      {education.map((item, index) => (
        <Stack
          key={index}
          gap={1.5}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2">
              {item.institution || t('cv.addEducation')}
            </Typography>

            <Stack direction="row">
              <IconButton
                onClick={() => moveUp(index)}
                disabled={disabled || index === 0}
              >
                <ArrowUpwardIcon />
              </IconButton>

              <IconButton
                onClick={() => moveDown(index)}
                disabled={disabled || index === education.length - 1}
              >
                <ArrowDownwardIcon />
              </IconButton>

              <IconButton
                onClick={() => deleteEducation(index)}
                disabled={disabled}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>

          <TextField
            label={t('profile.institution')}
            value={item.institution}
            onChange={(e) =>
              updateField(index, 'institution', e.target.value)
            }
            disabled={disabled}
          />

          <TextField
            label={t('profile.degree')}
            value={item.degree || ''}
            onChange={(e) =>
              updateField(index, 'degree', e.target.value)
            }
            disabled={disabled}
          />

          <TextField
            label={t('profile.field')}
            value={item.field || ''}
            onChange={(e) =>
              updateField(index, 'field', e.target.value)
            }
            disabled={disabled}
          />

          <TextField
            label={t('profile.educationLocation')}
            value={item.location || ''}
            onChange={(e) =>
              updateField(index, 'location', e.target.value)
            }
            disabled={disabled}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField
              label={t('profile.startDate')}
              type="date"
              value={item.startDate || ''}
              onChange={(e) =>
                updateField(index, 'startDate', e.target.value)
              }
              disabled={disabled}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              fullWidth
            />

            <TextField
              label={t('profile.endDate')}
              type="date"
              value={item.endDate || ''}
              onChange={(e) =>
                updateField(index, 'endDate', e.target.value)
              }
              disabled={disabled}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              fullWidth
            />
          </Stack>

          <TextField
            label={t('profile.educationDescription')}
            value={item.description || ''}
            onChange={(e) =>
              updateField(index, 'description', e.target.value)
            }
            disabled={disabled}
            multiline
            minRows={2}
          />
        </Stack>
      ))}

      <Button
        onClick={addEducation}
        disabled={disabled}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('cv.addEducation')}
      </Button>
    </Stack>
  );
};

export default CvEducationSectionEditor;