export type UserRole = 'TEAM_MEMBER' | 'MANAGER';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
