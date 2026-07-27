import { Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import type { CvSkill } from '../../../../shared/types/cv';
import { moveItem } from '../../../../shared/utils/moveItem';

type Props = {
  skills: CvSkill[];
  onChange: (skills: CvSkill[]) => void;
  disabled?: boolean;
};

const CvSkillsSectionEditor = ({ skills, onChange, disabled = false }: Props) => {
  const { t } = useTranslation();

  const updateSkill = (index: number, patch: Partial<CvSkill>) => {
    const nextSkills = skills.map((skill, i) => (i === index ? { ...skill, ...patch } : skill));
    onChange(nextSkills);
  };

  const addSkill = () => {
    onChange([...skills, { label: '' }]);
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <Stack gap={1.5}>
      <Typography variant="h6">{t('cv.documentSkills')}</Typography>

      {skills.map((skill, index) => (
        <Stack key={index} direction="row" gap={1} alignItems="flex-start">
          <TextField
            label={t('cv.skillLabel')}
            value={skill.label}
            onChange={(e) => updateSkill(index, { label: e.target.value })}
            disabled={disabled}
            fullWidth
          />
          <TextField
            label={t('cv.skillValue')}
            value={skill.value || ''}
            onChange={(e) => updateSkill(index, { value: e.target.value })}
            disabled={disabled}
            fullWidth
          />
          <TextField
            label={t('cv.skillGroup')}
            value={skill.group || ''}
            onChange={(e) => updateSkill(index, { group: e.target.value })}
            disabled={disabled}
            fullWidth
          />
          <IconButton
            aria-label={t('cv.moveUp')}
            onClick={() => onChange(moveItem(skills, index, -1))}
            disabled={disabled || index === 0}
          >
            <ArrowUpwardIcon />
          </IconButton>
          <IconButton
            aria-label={t('cv.moveDown')}
            onClick={() => onChange(moveItem(skills, index, 1))}
            disabled={disabled || index === skills.length - 1}
          >
            <ArrowDownwardIcon />
          </IconButton>
          <IconButton
            aria-label={t('cv.removeItem')}
            onClick={() => removeSkill(index)}
            disabled={disabled}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}

      <Button onClick={addSkill} disabled={disabled} sx={{ alignSelf: 'flex-start' }}>
        {t('cv.addSkill')}
      </Button>
    </Stack>
  );
};

export default CvSkillsSectionEditor;
