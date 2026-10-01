import { useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CandidateProfile } from '../../../shared/types/candidateProfile';
import { createCandidateProfileFormSchema } from '../../../shared/utils/cvSchemas';

type Props = {
  initialProfile: CandidateProfile;
  onSave: (profile: CandidateProfile) => Promise<void> | void;
  saving?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
};

type FormValues = {
  headline: string;
  publicEmail: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
};

type FieldErrors = {
  headline?: string;
  publicEmail?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
};

const toFormValues = (profile: CandidateProfile): FormValues => ({
  headline: profile.headline || '',
  publicEmail: profile.publicEmail || '',
  phone: profile.phone || '',
  location: profile.location || '',
  linkedinUrl: profile.linkedinUrl || '',
  githubUrl: profile.githubUrl || '',
  portfolioUrl: profile.portfolioUrl || '',
});

const CandidateContactForm = ({
  initialProfile,
  onSave,
  saving = false,
  disabled = false,
  errorMessage,
}: Props) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormValues>(() => toFormValues(initialProfile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [profileSnapshot, setProfileSnapshot] = useState(initialProfile);

  if (initialProfile !== profileSnapshot) {
    setProfileSnapshot(initialProfile);
    setForm(toFormValues(initialProfile));
    setErrors({});
  }

  const schema = createCandidateProfileFormSchema({
    invalidEmail: t('profile.invalidEmail'),
    invalidUrl: t('profile.invalidUrl'),
  });

  const validate = (values: FormValues): FieldErrors => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
      switch (issue.path[0]) {
        case 'headline': errors.headline = issue.message; break;
        case 'publicEmail': errors.publicEmail = issue.message; break;
        case 'phone': errors.phone = issue.message; break;
        case 'location': errors.location = issue.message; break;
        case 'linkedinUrl': errors.linkedinUrl = issue.message; break;
        case 'githubUrl': errors.githubUrl = issue.message; break;
        case 'portfolioUrl': errors.portfolioUrl = issue.message; break;
      }
    }
    return errors;
  };

  const updateField = (key: keyof FormValues, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors(validate(next));
  };

  const handleSave = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSave(form);
  };

  return (
    <Paper sx={{ p: 3, m: 1, borderRadius: '12px', maxWidth: 640 }}>
      <Stack gap={2}>
        <Typography variant="h6">{t('profile.contactsTitle')}</Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          label={t('profile.headline')}
          value={form.headline}
          onChange={(e) => updateField('headline', e.target.value)}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.publicEmail')}
          value={form.publicEmail}
          onChange={(e) => updateField('publicEmail', e.target.value)}
          error={Boolean(errors.publicEmail)}
          helperText={errors.publicEmail}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.phone')}
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.location')}
          value={form.location}
          onChange={(e) => updateField('location', e.target.value)}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.linkedinUrl')}
          value={form.linkedinUrl}
          onChange={(e) => updateField('linkedinUrl', e.target.value)}
          error={Boolean(errors.linkedinUrl)}
          helperText={errors.linkedinUrl}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.githubUrl')}
          value={form.githubUrl}
          onChange={(e) => updateField('githubUrl', e.target.value)}
          error={Boolean(errors.githubUrl)}
          helperText={errors.githubUrl}
          disabled={disabled || saving}
          fullWidth
        />

        <TextField
          label={t('profile.portfolioUrl')}
          value={form.portfolioUrl}
          onChange={(e) => updateField('portfolioUrl', e.target.value)}
          error={Boolean(errors.portfolioUrl)}
          helperText={errors.portfolioUrl}
          disabled={disabled || saving}
          fullWidth
        />

        {!disabled && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || Object.keys(errors).length > 0}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving ? t('profile.saving') : t('profile.saveContacts')}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default CandidateContactForm;
