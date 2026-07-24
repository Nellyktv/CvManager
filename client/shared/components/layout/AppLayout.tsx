import { Box, Drawer } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import useUserStore from '../../../store/UserStore';
import { api } from '../../../api/axios.api';
import { LOGIN_ROUTE } from '../../utils/constsLinks';
import { DRAWER_WIDTH } from './AppLayout.constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const isAuth = useUserStore((state) => state.isAuth);
  const currentUser = useUserStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!currentUser.id) return;

    const loadName = async () => {
      try {
        const { data } = await api.get(`/user/${currentUser.id}`);
        setDisplayName(`${data.user.firstName || ''} ${data.user.lastName || ''}`.trim());
      } catch (error) {
        console.error('Failed to load user name', error);
      }
    };

    loadName();
  }, [currentUser.id]);

  const initials = displayName
    .split(' ')
    .map((el) => el[0] || '')
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate(LOGIN_ROUTE);
  };

  const drawerPaperStyle = {
    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', p: 2 },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          ...drawerPaperStyle,
        }}
      >
        <Sidebar role={currentUser.role} onClose={() => setMobileOpen(false)} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          ...drawerPaperStyle,
        }}
      >
        <Sidebar role={currentUser.role} onClose={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          displayName={displayName}
          initials={initials}
          email={currentUser.email}
          role={currentUser.role}
          isAuth={isAuth}
          onLogout={handleLogout}
        />

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
