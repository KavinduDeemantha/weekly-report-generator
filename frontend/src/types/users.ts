import type { UserRole } from './auth';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
};

export type PaginatedUsers = {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
};
