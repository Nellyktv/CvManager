import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Attribute, Candidate, PositionFormValues } from './PositionPage.constants';

type FormField = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type Props = {
  open: boolean;
  editId: number | null;
  formFields: FormField[];
  attributes: Attribute[];
  candidates: Candidate[];
  form: PositionFormValues;
  setForm: (form: PositionFormValues) => void;
  onClose: () => void;
  onSave: () => void;
};

const getCandidateLabel = (el: Candidate) =>
  `${el.firstName || ''} ${el.lastName || ''}`.trim();

const PositionFormDialog = ({
  open,
  editId,
  formFields,
  attributes,
  candidates,
  form,
  setForm,
  onClose,
  onSave,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editId ? t('positions.editPosition') : t('positions.newPosition')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {formFields.map((el) => (
            <TextField
              key={el.label}
              label={el.label}
              value={el.value}
              onChange={(e) => el.onChange(e.target.value)}
            />
          ))}

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={attributes}
            getOptionLabel={(el) => el.name}
            value={attributes.filter((el) =>
              form.attributeIds.includes(el.id)
            )}
            onChange={(_, selected) =>
              setForm({
                ...form,
                attributeIds: selected.map((el) => el.id),
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('positions.attributesLabel')}
                helperText={t('positions.attributesRequiredHint')}
              />
            )}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={candidates}
            getOptionLabel={getCandidateLabel}
            value={candidates.filter((el) =>
              form.allowedCandidateIds.includes(el.id)
            )}
            onChange={(_, selected) =>
              setForm({
                ...form,
                allowedCandidateIds: selected.map((el) => el.id),
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('positions.allowedCandidatesLabel')}
                helperText={t('positions.allowedCandidatesHint')}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>

        <Button
          variant="contained"
          disabled={form.attributeIds.length === 0}
          onClick={onSave}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionFormDialog;
