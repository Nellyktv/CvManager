import { useState } from 'react';
import { Button, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import type { CvContent, CvLink } from '../../../../shared/types/cv';
import { cvLinkSchema } from '../../../../shared/utils/cvSchemas';

type Props = {
  contact: CvContent['contact'];
  onChange: (contact: CvContent['contact']) => void;
  disabled?: boolean;
};

const emptyDraft = (): CvLink => ({ label: '', url: '' });

const CvContactSectionEditor = ({ contact, onChange, disabled = false }: Props) => {
  const { t } = useTranslation();
  const [draftLink, setDraftLink] = useState<CvLink | null>(null);

  const updateField = <K extends keyof CvContent['contact']>(
    key: K,
    value: CvContent['contact'][K],
  ) => {
    onChange({ ...contact, [key]: value });
  };

  const updateLink = (index: number, key: keyof CvLink, value: string) => {
    const links = contact.links.map((link, i) =>
      i === index ? { ...link, [key]: value } : link,
    );
    onChange({ ...contact, links });
  };

  const addLink = () => {
    if (disabled || draftLink) return;
    setDraftLink(emptyDraft());
  };

  const updateDraft = (key: keyof CvLink, value: string) => {
    setDraftLink((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const commitDraft = () => {
    if (!draftLink) return;
    if (!cvLinkSchema.safeParse(draftLink).success) return;
    onChange({ ...contact, links: [...contact.links, draftLink] });
    setDraftLink(null);
  };

  const cancelDraft = () => {
    setDraftLink(null);
  };

  const removeLink = (index: number) => {
    onChange({
      ...contact,
      links: contact.links.filter((_, i) => i !== index),
    });
  };

  return (
    <Stack gap={1.5}>
      <Typography variant="h6">{t('cv.documentContact')}</Typography>
      <Grid container spacing={1.5} data-testid="cv-contact-fields-grid">
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('cv.contactName')}
            value={contact.name}
            onChange={(e) => updateField('name', e.target.value)}
            disabled={disabled}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('cv.contactHeadline')}
            value={contact.headline ?? ''}
            onChange={(e) => updateField('headline', e.target.value)}
            disabled={disabled}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('cv.contactEmail')}
            value={contact.email ?? ''}
            onChange={(e) => updateField('email', e.target.value)}
            disabled={disabled}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('cv.contactPhone')}
            value={contact.phone ?? ''}
            onChange={(e) => updateField('phone', e.target.value)}
            disabled={disabled}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('cv.contactLocation')}
            value={contact.location ?? ''}
            onChange={(e) => updateField('location', e.target.value)}
            disabled={disabled}
            fullWidth
          />
        </Grid>
      </Grid>

      {contact.links.map((link, index) => (
        <Stack key={index} direction="row" gap={1} alignItems="flex-start">
          <TextField
            label={t('cv.contactLinkLabel')}
            value={link.label}
            onChange={(e) => updateLink(index, 'label', e.target.value)}
            disabled={disabled}
            fullWidth
          />
          <TextField
            label={t('cv.contactLinkUrl')}
            value={link.url}
            onChange={(e) => updateLink(index, 'url', e.target.value)}
            disabled={disabled}
            fullWidth
          />
          <IconButton
            aria-label={t('cv.removeItem')}
            onClick={() => removeLink(index)}
            disabled={disabled}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}

      {draftLink && (
        <Stack direction="row" gap={1} alignItems="flex-start">
          <TextField
            label={t('cv.contactLinkLabel')}
            value={draftLink.label}
            onChange={(e) => updateDraft('label', e.target.value)}
            onBlur={commitDraft}
            disabled={disabled}
            fullWidth
          />
          <TextField
            label={t('cv.contactLinkUrl')}
            value={draftLink.url}
            onChange={(e) => updateDraft('url', e.target.value)}
            onBlur={commitDraft}
            disabled={disabled}
            fullWidth
          />
          <IconButton
            aria-label={t('cv.removeItem')}
            onClick={cancelDraft}
            disabled={disabled}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      )}

      <Button onClick={addLink} disabled={disabled || Boolean(draftLink)} sx={{ alignSelf: 'flex-start' }}>
        {t('cv.addContactLink')}
      </Button>
    </Stack>
  );
};

export default CvContactSectionEditor;
