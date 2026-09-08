import { apiClient } from '../../api/client';
import type { PaginatedProjects, Project } from '../../types/projects';
import type { ProjectFormValues } from './schemas';

export const projectsApi = {
  async listActive() {
    const response = await apiClient.get<PaginatedProjects>('/projects', {
      params: { page: 1, limit: 100 },
    });
    return response.data;
  },

  async list(filters: { page: number; limit: number; isActive?: boolean }) {
    const response = await apiClient.get<PaginatedProjects>('/projects', {
      params: filters,
    });
    return response.data;
  },

  async create(values: ProjectFormValues) {
    const response = await apiClient.post<Project>('/projects', {
      name: values.name,
      description: values.description?.trim() || undefined,
    });
    return response.data;
  },

  async update(id: string, values: ProjectFormValues) {
    const response = await apiClient.patch<Project>(`/projects/${id}`, {
      name: values.name,
      description: values.description?.trim() || undefined,
      isActive: values.isActive,
    });
    return response.data;
  },

  async deactivate(id: string) {
    const response = await apiClient.delete<Project>(`/projects/${id}`);
    return response.data;
  },
};
