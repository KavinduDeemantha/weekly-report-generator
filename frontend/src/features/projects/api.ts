import { apiClient } from '../../api/client';
import type { PaginatedProjects } from '../../types/projects';

export const projectsApi = {
  async listActive() {
    const response = await apiClient.get<PaginatedProjects>('/projects', {
      params: { page: 1, limit: 100 },
    });
    return response.data;
  },
};
