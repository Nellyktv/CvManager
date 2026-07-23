import {
  Stack,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { navItems } from './AppLayout.constants';
import type { UserRole } from '../../../store/UserStore';

type SidebarProps = {
  role: UserRole | '';
  onClose: () => void;
};

const Sidebar = ({ role, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (linkTo: string) =>
    linkTo === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(linkTo);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ p: 1, m: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Avatar sx={{ borderRadius: 2 }}>CV</Avatar>
          <Typography variant="h6">CV Manager</Typography>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <List>
        {navItems
          .filter((el) => el.roles.includes(role))
          .map((el) => (
            <Link to={el.linkTo} key={el.key} onClick={onClose}>
              <ListItemButton
                selected={isActive(el.linkTo)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon>{el.icon}</ListItemIcon>
                <ListItemText primary={t(el.i18nKey)} />
              </ListItemButton>
            </Link>
          ))}
      </List>
    </>
  );
};

export default Sidebar;
