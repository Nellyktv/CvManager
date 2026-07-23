import { Route, Routes } from 'react-router';
import {
  authPages,
  authRoutes,
  publicRoutes,
  authCandidateRoutes,
  authRecruiterRoutes,
  authAdminRoutes,
} from './AllRoutes';
import useUserStore from '../store/UserStore';
import AppLayout from '../shared/components/layout/AppLayout';
import NotFoundPage from '../features/not-found/NotFoundPage';

const AppRouter = () => {
const isAuth = useUserStore((state) => state.isAuth);
const role = useUserStore((state)=>state.user.role )

  return (
    <Routes>
      {authPages.map((el) => (
        <Route key={el.path} path={el.path} element={el.componentForRole} />
      ))}

      <Route element={<AppLayout />}>
        {publicRoutes.map((el) => (
          <Route key={el.path} path={el.path} element={el.componentForRole}></Route>
        ))}
        {isAuth &&
          authRoutes.map((el) => (
            <Route key={el.path} path={el.path} element={el.componentForRole}></Route>
          ))}
        {isAuth && (role === 'CANDIDATE' || role === 'ADMIN') &&
          authCandidateRoutes.map((el) => (
            <Route key={el.path} path={el.path} element={el.componentForRole} />
          ))}
        {isAuth && (role === 'RECRUITER' || role === 'ADMIN') &&
          authRecruiterRoutes.map((el) => (
            <Route key={el.path} path={el.path} element={el.componentForRole} />
          ))}
        {isAuth && role === 'ADMIN' &&
          authAdminRoutes.map((el) => (
            <Route key={el.path} path={el.path} element={el.componentForRole} />
          ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
