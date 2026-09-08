import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoading } from '../components/common/PageState';
import { useCurrentUser } from '../features/auth/hooks';
import type { UserRole } from '../types/auth';
import { getHomePathForRole } from './paths';

export function RoleRedirect() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomePathForRole(user.role)} replace />;
}

export function PublicOnlyRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading label="Checking your session" />;
  }

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
