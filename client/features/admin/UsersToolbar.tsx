import { Box, Stack, Typography, Button } from '@mui/material';

import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useTranslation } from 'react-i18next';

type UsersToolbarProps = {
  selectedCount: number;
  anyBlocked: boolean;
  anyUnblocked: boolean;
  onDelete: () => void;
  onAssignRole: () => void;
  onBlock: () => void;
  onUnblock: () => void;
};

const UsersToolbar = ({
  selectedCount,
  anyBlocked,
  anyUnblocked,
  onDelete,
  onAssignRole,
  onBlock,
  onUnblock,
}: UsersToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
      sx={{ p: 1 }}
    >
      <Button
        onClick={onBlock}
        variant="outlined"
        startIcon={<BlockIcon />}
        disabled={!selectedCount || !anyUnblocked}
      >
        {t('common.block')}
      </Button>
      <Button
        variant="outlined"
        onClick={onUnblock}
        startIcon={<LockOpenIcon />}
        disabled={!selectedCount || !anyBlocked}
      >
        {t('common.unblock')}
      </Button>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        disabled={!selectedCount}
        onClick={onDelete}
      >
        {t('common.delete')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<AssignmentIndIcon />}
        disabled={selectedCount !== 1}
        onClick={onAssignRole}
      >
        {t('common.assignRole')}
      </Button>
      <Box sx={{ flexGrow: 1 }} />
      {selectedCount === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t('common.noRowsSelected')}
        </Typography>
      )}
    </Stack>
  );
};

export default UsersToolbar;
