export type Project = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
