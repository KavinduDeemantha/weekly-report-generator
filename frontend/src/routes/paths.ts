import type { UserRole } from '../types/auth';

export function getHomePathForRole(role: UserRole) {
  return role === 'MANAGER' ? '/manager/dashboard' : '/reports';
}
