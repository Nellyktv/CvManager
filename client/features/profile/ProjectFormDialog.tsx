import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';

import MarkdownProjectEditor from '../cv/components/MarkdownProjectEditor';
import { createProjectFormSchema } from '../../shared/utils/cvSchemas';
import type { ProjectFormValues } from './ProfilePage.constants';

type Props = {
  open: boolean;
  editId: number | null;
  form: ProjectFormValues;
  onChange: (form: ProjectFormValues) => void;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
};

type FieldErrors = {
  title?: string;
  endDate?: string;
  links?: string[];
  form?: string;
};

const ProjectFormDialog = ({
  open,
  editId,
  form,
  onChange,
  onClose,
  onSave,
  saving = false,
}: Props) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<FieldErrors>({});

  const schema = createProjectFormSchema({
    titleRequired: t('profile.projectTitleRequired'),
    invalidUrl: t('profile.invalidUrl'),
    invalidDateRange: t('profile.invalidDateRange'),
    markdownNoHtml: t('profile.markdownNoHtml'),
  });

  const validate = (values: ProjectFormValues): FieldErrors => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const next: FieldErrors = { links: [] };
    for (const issue of result.error.issues) {
      const [head, index, leaf] = issue.path;
      if (head === 'title' && !next.title) {
        next.title = issue.message;
      } else if (head === 'endDate' && !next.endDate) {
        next.endDate = issue.message;
      } else if (head === 'descriptionMarkdown' && !next.form) {
        next.form = issue.message;
      } else if (head === 'links' && typeof index === 'number' && leaf === 'url') {
        next.links![index] = issue.message;
      } else if (!next.form) {
        next.form = issue.message;
      }
    }
    return next;
  };

  const updateLink = (index: number, key: 'label' | 'url', value: string) => {
    const links = form.links.map((link, i) =>
      i === index ? { ...link, [key]: value } : link,
    );
    onChange({ ...form, links });
  };

  const addLink = () => {
    onChange({ ...form, links: [...form.links, { label: '', url: '' }] });
  };

  const removeLink = (index: number) => {
    onChange({
      ...form,
      links: form.links.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.endDate || nextErrors.form) return;
    if (nextErrors.links?.some(Boolean)) return;
    onSave();
  };

  const handleClose = () => {
    if (saving) return;
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {editId ? t('profile.editProject') : t('profile.newProject')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errors.form && <Alert severity="error">{errors.form}</Alert>}

          <TextField
            label={t('profile.projectTitle')}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            error={Boolean(errors.title)}
            helperText={errors.title}
            required
          />

          <TextField
            label={t('profile.projectRole')}
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value })}
          />

          <Stack direction="row" gap={2}>
            <TextField
              label={t('profile.projectStartDate')}
              type="date"
              value={form.startDate}
              onChange={(e) => onChange({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={t('profile.projectEndDate')}
              type="date"
              value={form.endDate}
              onChange={(e) => onChange({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.endDate)}
              helperText={errors.endDate}
              fullWidth
            />
          </Stack>

          <Stack spacing={1.5}>
            {form.links.map((link, index) => (
              <Stack key={index} direction="row" gap={2} alignItems="flex-start">
                <TextField
                  label={t('profile.projectLinkLabel')}
                  value={link.label}
                  onChange={(e) => updateLink(index, 'label', e.target.value)}
                  fullWidth
                />
                <TextField
                  label={t('profile.projectLinkUrl')}
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  error={Boolean(errors.links?.[index])}
                  helperText={errors.links?.[index]}
                  fullWidth
                />
                <Button
                  onClick={() => removeLink(index)}
                  disabled={saving}
                  sx={{ mt: 1, flexShrink: 0 }}
                >
                  {t('profile.removeProjectLink')}
                </Button>
              </Stack>
            ))}

            <Button onClick={addLink} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
              {t('profile.addProjectLink')}
            </Button>
          </Stack>

          <TextField
            label={t('profile.displayOrder')}
            type="number"
            value={form.displayOrder}
            onChange={(e) => onChange({ ...form, displayOrder: e.target.value })}
          />

          <MarkdownProjectEditor
            value={form.descriptionMarkdown}
            onChange={(value) =>
              onChange({ ...form, descriptionMarkdown: value })
            }
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

export default ProjectFormDialog;
