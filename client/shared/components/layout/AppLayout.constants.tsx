import SpeedIcon from '@mui/icons-material/Speed';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SearchIcon from '@mui/icons-material/Search';

import {
  PUBLIC_ROUTE,
  POSITION_ROUTE,
  CV_LIST_ROUTE,
  CANDIDATE_ROUTE,
  CANDIDAT_SKILLS_CONTAINER_ROUTER,
  ADMIN_ROUTE,
  SEARCH_ROUTE,
  SETTINGS_ROUTE,
} from '../../utils/constsLinks';

export const DRAWER_WIDTH = 240;

export type NavItem = {
  key: string;
  i18nKey: string;
  icon: React.ReactNode;
  linkTo: string;
  roles: string[];
};


export const navItems: NavItem[] = [
  { key: 'Dashboard', i18nKey: 'nav.dashboard', icon: <SpeedIcon />, linkTo: PUBLIC_ROUTE, roles: ['', 'CANDIDATE', 'RECRUITER', 'ADMIN'] },
  { key: 'Positions', i18nKey: 'nav.positions', icon: <WorkOutlineIcon />, linkTo: POSITION_ROUTE, roles: ['', 'CANDIDATE', 'RECRUITER', 'ADMIN'] },
  { key: 'CVs', i18nKey: 'nav.cvs', icon: <DescriptionOutlinedIcon />, linkTo: CV_LIST_ROUTE, roles: ['CANDIDATE', 'RECRUITER', 'ADMIN'] },
  { key: 'Profile', i18nKey: 'nav.profile', icon: <PersonOutlineIcon />, linkTo: CANDIDATE_ROUTE, roles: ['CANDIDATE', 'ADMIN'] },
  {
    key: 'Attribute Library',
    i18nKey: 'nav.attributeLibrary',
    icon: <BusinessCenterOutlinedIcon />,
    linkTo: CANDIDAT_SKILLS_CONTAINER_ROUTER,
    roles: ['RECRUITER', 'ADMIN'],
  },
  { key: 'Search', i18nKey: 'nav.search', icon: <SearchIcon />, linkTo: SEARCH_ROUTE, roles: ['RECRUITER', 'ADMIN'] },
  { key: 'Users', i18nKey: 'nav.users', icon: <PeopleOutlineIcon />, linkTo: ADMIN_ROUTE, roles: ['ADMIN'] },
  { key: 'Settings', i18nKey: 'nav.settings', icon: <SettingsOutlinedIcon />, linkTo: SETTINGS_ROUTE, roles: ['CANDIDATE', 'RECRUITER', 'ADMIN'] },
];
