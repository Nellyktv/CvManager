import { useState } from 'react';
import {
  Button,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import type { CvContact } from '../../../../shared/types/cv';
import CvDialog from './CvDialog';

type Props = {
  contact: CvContact;
  onChange: (contact: CvContact) => void;
  disabled?: boolean;
};

const CvContactSectionEditor = ({
  contact,
  onChange,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(-1);

  const onClose = () => {
    setOpen(false);
    setSelectedLinkIndex(-1);
  };

  const openDeleteDialog = (index: number) => {
    setSelectedLinkIndex(index);
    setOpen(true);
  };

  const updateField = (
    field: 'name' | 'headline' | 'email' | 'phone' | 'location',
    value: string,
  ) => {
    onChange({
      ...contact,
      [field]: value,
    });
  };

  const updateLink = (
    index: number,
    field: 'label' | 'url',
    value: string,
  ) => {
    const links = contact.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link,
    );

    onChange({
      ...contact,
      links,
    });
  };

  const addLink = () => {
    onChange({
      ...contact,
      links: [
        ...contact.links,
        {
          label: '',
          url: '',
        },
      ],
    });
  };

  const confirmDelete = () => {
    const links = contact.links.filter((_, i) => i !== selectedLinkIndex);

    onChange({
      ...contact,
      links,
    });

    setOpen(false);
    setSelectedLinkIndex(-1);
  };

  return (
    <Stack spacing={2}>
      <CvDialog open={open} onClose={onClose} onDelete={confirmDelete} />

      <Typography variant="h6">
        {t('cv.documentContact')}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('cv.contactName')}
            value={contact.name}
            onChange={(e) => updateField('name', e.target.value)}
            disabled={disabled}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('cv.contactHeadline')}
            value={contact.headline || ''}
            onChange={(e) => updateField('headline', e.target.value)}
            disabled={disabled}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('cv.contactEmail')}
            value={contact.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            disabled={disabled}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('cv.contactPhone')}
            value={contact.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            disabled={disabled}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={t('cv.contactLocation')}
            value={contact.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            disabled={disabled}
          />
        </Grid>
      </Grid>

      {contact.links.map((link, index) => (
        <Stack key={index} direction="row" spacing={1}>
          <TextField
            fullWidth
            label={t('cv.contactLinkLabel')}
            value={link.label}
            onChange={(e) =>
              updateLink(index, 'label', e.target.value)
            }
            disabled={disabled}
          />

          <TextField
            fullWidth
            label={t('cv.contactLinkUrl')}
            value={link.url}
            onChange={(e) =>
              updateLink(index, 'url', e.target.value)
            }
            disabled={disabled}
          />

          <IconButton
            onClick={() => openDeleteDialog(index)}
            disabled={disabled}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}

      <Button
        onClick={addLink}
        disabled={disabled}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('cv.addContactLink')}
      </Button>
    </Stack>
  );
};

export default CvContactSectionEditor;