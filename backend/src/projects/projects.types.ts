import type { PaginationMeta } from '../common/pagination.js';

export type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  assignedMemberCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedProjects = {
  data: ProjectResponse[];
  meta: PaginationMeta;
};

export type ProjectMemberResponse = {
  id: string;
  name: string;
  email: string;
  assignedAt: Date;
};
