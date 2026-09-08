import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { NewReportPage } from './pages/NewReportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReportsPage } from './pages/ReportsPage';
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
  RoleRedirect,
} from './routes/guards';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route
            element={<RequireRole allowedRoles={['TEAM_MEMBER']} />}
          >
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/new" element={<NewReportPage />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['MANAGER']} />}>
            <Route
              path="/manager/dashboard"
              element={<ManagerDashboardPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
