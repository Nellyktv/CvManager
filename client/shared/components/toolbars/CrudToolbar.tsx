import { Stack, Button } from '@mui/material';
import type { ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

type CrudToolbarProps = {
  selectedCount: number;
  onDelete: () => void;
  onEdit: () => void;
  onAdd: () => void;
  addLabel: string;
  children?: ReactNode;
};

const CrudToolbar = ({
  selectedCount,
  onDelete,
  onEdit,
  onAdd,
  addLabel,
  children,
}: CrudToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
      {children}

      <Button
        color="error"
        variant="outlined"
        disabled={!selectedCount}
        onClick={onDelete}
      >
        {t('common.delete')}
      </Button>
      <Button variant="outlined" disabled={selectedCount !== 1} onClick={onEdit}>
        {t('common.edit')}
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        {addLabel}
      </Button>
    </Stack>
  );
};

export default CrudToolbar;
