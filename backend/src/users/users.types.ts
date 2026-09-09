import { Role } from '../generated/prisma/enums.js';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type UserWithPassword = SafeUser & {
  passwordHash: string;
  isActive: boolean;
};

export type UserListItem = SafeUser & {
  isActive: boolean;
  createdAt: Date;
};

export type PaginatedUsers = {
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};
