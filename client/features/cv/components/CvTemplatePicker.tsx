import { useId, useState, type MouseEvent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvTemplateKey } from '../../../shared/types/cv';
import { CV_TEMPLATE_OPTIONS, templateLabelKey } from '../CvPage.constants';

type CvTemplatePickerProps = {
  value: CvTemplateKey;
  onChange: (next: CvTemplateKey) => void;
  disabled?: boolean;
};

type CvTemplateDescriptionKey =
  | 'cv.templateEditorialSidebarDescription'
  | 'cv.templateStructuredMinimalDescription';

const templateDescriptionKey = (key: CvTemplateKey): CvTemplateDescriptionKey =>
  key === 'structured-minimal'
    ? 'cv.templateStructuredMinimalDescription'
    : 'cv.templateEditorialSidebarDescription';

const TemplateThumbnail = ({ templateKey }: { templateKey: CvTemplateKey }) => (
  <Box
    aria-hidden
    sx={{
      width: 56,
      height: 40,
      borderRadius: '2px',
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
      display: 'grid',
      gridTemplateColumns: templateKey === 'editorial-sidebar' ? '32% 1fr' : '1fr',
      bgcolor: 'background.default',
      flexShrink: 0,
    }}
  >
    {templateKey === 'editorial-sidebar' ? (
      <>
        <Box sx={{ bgcolor: 'grey.700' }} />
        <Box sx={{ p: 0.5 }}>
          <Box sx={{ height: 4, width: '55%', bgcolor: 'grey.500', mb: 0.35 }} />
          <Box sx={{ height: 3, width: '80%', bgcolor: 'grey.400', mb: 0.25 }} />
          <Box sx={{ height: 3, width: '70%', bgcolor: 'grey.400' }} />
        </Box>
      </>
    ) : (
      <>
        <Box sx={{ height: 10, bgcolor: 'grey.700' }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 0.35,
            p: 0.5,
          }}
        >
          <Box>
            <Box sx={{ height: 3, width: '90%', bgcolor: 'grey.500', mb: 0.25 }} />
            <Box sx={{ height: 3, width: '75%', bgcolor: 'grey.400' }} />
          </Box>
          <Box>
            <Box sx={{ height: 3, width: '80%', bgcolor: 'grey.500', mb: 0.25 }} />
            <Box sx={{ height: 3, width: '65%', bgcolor: 'grey.400' }} />
          </Box>
        </Box>
      </>
    )}
  </Box>
);

const CvTemplatePicker = ({ value, onChange, disabled = false }: CvTemplatePickerProps) => {
  const { t } = useTranslation();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const currentName = t(templateLabelKey(value));

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    if (!disabled) setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (key: CvTemplateKey) => {
    onChange(key);
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        disabled={disabled}
        onClick={handleOpen}
        endIcon={<KeyboardArrowDownIcon />}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? menuId : undefined}
      >
        {t('cv.templateSelection')}:{'\u00a0'}
        <Box component="span">{currentName}</Box>
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          list: {
            'aria-label': t('cv.templateSelection'),
            dense: true,
          },
        }}
      >
        {CV_TEMPLATE_OPTIONS.map(({ key }) => {
          const selected = value === key;
          const name = t(templateLabelKey(key));
          const description = t(templateDescriptionKey(key));

          return (
            <MenuItem
              key={key}
              role="menuitemradio"
              aria-checked={selected}
              selected={selected}
              onClick={() => handleSelect(key)}
              sx={{ alignItems: 'flex-start', gap: 1, py: 1.25, maxWidth: 320 }}
            >
              <TemplateThumbnail templateKey={key} />
              <ListItemText
                primary={name}
                secondary={description}
                slotProps={{
                  primary: { variant: 'subtitle2' },
                  secondary: { variant: 'caption' },
                }}
              />
              <ListItemIcon sx={{ minWidth: 28, mt: 0.25, justifyContent: 'flex-end' }}>
                {selected ? (
                  <CheckIcon fontSize="small" color="primary" aria-hidden />
                ) : null}
              </ListItemIcon>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default CvTemplatePicker;
