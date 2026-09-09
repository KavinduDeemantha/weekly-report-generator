export type Project = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  assignedMemberCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  assignedAt: string;
};

export type PaginatedProjects = {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
