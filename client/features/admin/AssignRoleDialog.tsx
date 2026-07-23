import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { UserRole } from '../../store/UserStore';

type Props = {
  open: boolean;
  roles: UserRole[];
  value: UserRole;
  onChange: (role: UserRole) => void;
  onClose: () => void;
  onSave: () => void;
};

const AssignRoleDialog = ({
  open,
  roles,
  value,
  onChange,
  onClose,
  onSave,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('common.assignRole')}</DialogTitle>

      <DialogContent>
        <Select
          fullWidth
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value as UserRole)}
          sx={{ mt: 1 }}
        >
          {roles.map((role) => (
            <MenuItem key={role} value={role}>
              {t(`roles.${role.toLowerCase()}`)}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>

        <Button variant="contained" onClick={onSave}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignRoleDialog;
