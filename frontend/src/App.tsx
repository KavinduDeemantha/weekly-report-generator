import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLoading } from './components/common/PageState';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
  RoleRedirect,
} from './routes/guards';

const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
);
const NewReportPage = lazy(() =>
  import('./pages/NewReportPage').then((module) => ({
    default: module.NewReportPage,
  })),
);
const ReportDetailPage = lazy(() =>
  import('./pages/ReportDetailPage').then((module) => ({
    default: module.ReportDetailPage,
  })),
);
const EditReportPage = lazy(() =>
  import('./pages/EditReportPage').then((module) => ({
    default: module.EditReportPage,
  })),
);
const ReportVersionsPage = lazy(() =>
  import('./pages/ReportVersionsPage').then((module) => ({
    default: module.ReportVersionsPage,
  })),
);
const ReportVersionDetailPage = lazy(() =>
  import('./pages/ReportVersionDetailPage').then((module) => ({
    default: module.ReportVersionDetailPage,
  })),
);
const ManagerDashboardPage = lazy(() =>
  import('./pages/ManagerDashboardPage').then((module) => ({
    default: module.ManagerDashboardPage,
  })),
);
const ManagerReportsPage = lazy(() =>
  import('./pages/ManagerReportsPage').then((module) => ({
    default: module.ManagerReportsPage,
  })),
);
const ManagerReportDetailPage = lazy(() =>
  import('./pages/ManagerReportDetailPage').then((module) => ({
    default: module.ManagerReportDetailPage,
  })),
);
const ManagerReportVersionDetailPage = lazy(() =>
  import('./pages/ManagerReportVersionDetailPage').then((module) => ({
    default: module.ManagerReportVersionDetailPage,
  })),
);
const ManagerProjectsPage = lazy(() =>
  import('./pages/ManagerProjectsPage').then((module) => ({
    default: module.ManagerProjectsPage,
  })),
);
const ManagerUsersPage = lazy(() =>
  import('./pages/ManagerUsersPage').then((module) => ({
    default: module.ManagerUsersPage,
  })),
);
const ManagerAiAssistantPage = lazy(() =>
  import('./pages/ManagerAiAssistantPage').then((module) => ({
    default: module.ManagerAiAssistantPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);

export function App() {
  return (
    <Suspense fallback={<PageLoading label="Loading page" />}>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<RequireRole allowedRoles={['TEAM_MEMBER']} />}>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/new" element={<NewReportPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/reports/:id/edit" element={<EditReportPage />} />
              <Route
                path="/reports/:id/versions"
                element={<ReportVersionsPage />}
              />
              <Route
                path="/reports/:id/versions/:versionNumber"
                element={<ReportVersionDetailPage />}
              />
            </Route>

            <Route element={<RequireRole allowedRoles={['MANAGER']} />}>
              <Route
                path="/manager/dashboard"
                element={<ManagerDashboardPage />}
              />
              <Route path="/manager/reports" element={<ManagerReportsPage />} />
              <Route
                path="/manager/reports/:id"
                element={<ManagerReportDetailPage />}
              />
              <Route
                path="/manager/reports/:id/versions/:versionNumber"
                element={<ManagerReportVersionDetailPage />}
              />
              <Route path="/manager/projects" element={<ManagerProjectsPage />} />
              <Route path="/manager/users" element={<ManagerUsersPage />} />
              <Route
                path="/manager/ai-assistant"
                element={<ManagerAiAssistantPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
