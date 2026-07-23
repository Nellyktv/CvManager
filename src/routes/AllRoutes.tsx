import AdminPage from '../features/admin/AdminPage';
import AuthPage from '../features/auth/AuthPage';
import AttributesPage from '../features/attributes/AttributesPage';
import CvPage from '../features/cv/CvPage';
import CvListPage from '../features/cv/CvListPage';
import ProfilePage from '../features/profile/ProfilePage';
import MainPage from '../features/main/MainPage';
import SearchPage from '../features/search/SearchPage';
import SettingsPage from '../features/settings/SettingsPage';
import PositionPage from '../features/positions/PositionPage';
import {
  ADMIN_ROUTE,
  CANDIDAT_SKILLS_CONTAINER_ROUTER,
  CANDIDATE_ROUTE,
  CV_LIST_ROUTE,
  CV_ROUTE_CANDIDATE,
  LOGIN_ROUTE,
  PUBLIC_PROFILE_CANDIDATE_ROUTE,
  PUBLIC_ROUTE,
  REGISTER_ROUTE,
  SEARCH_ROUTE,
  SETTINGS_ROUTE,
  POSITION_ROUTE,
} from '../shared/utils/constsLinks';
const loginPage = true;


export const authPages = [
  { path: LOGIN_ROUTE, componentForRole: <AuthPage loginPage={loginPage} /> },
  { path: REGISTER_ROUTE, componentForRole: <AuthPage /> },
];

export const publicRoutes = [
  { path: PUBLIC_ROUTE, componentForRole: <MainPage /> },
  { path: POSITION_ROUTE, componentForRole: <PositionPage /> },
];

export const authRoutes = [
  { path: CV_LIST_ROUTE, componentForRole: <CvListPage /> },
  { path: CV_ROUTE_CANDIDATE, componentForRole: <CvPage /> },
  { path: SEARCH_ROUTE, componentForRole: <SearchPage /> },
  { path: SETTINGS_ROUTE, componentForRole: <SettingsPage /> },
  { path: PUBLIC_PROFILE_CANDIDATE_ROUTE, componentForRole: <ProfilePage /> },
];


export const authCandidateRoutes = [
  { path: CANDIDATE_ROUTE, componentForRole: <ProfilePage /> },
];


export const authRecruiterRoutes = [
  {
    path: CANDIDAT_SKILLS_CONTAINER_ROUTER,
    componentForRole: <AttributesPage />,
  },
];


export const authAdminRoutes = [
  { path: ADMIN_ROUTE, componentForRole: <AdminPage /> },
];
