import { apiClient } from '../../api/client';
import type { PaginatedUsers } from '../../types/users';

export const usersApi = {
  async list(filters: { page: number; limit: number }) {
    const response = await apiClient.get<PaginatedUsers>('/users', {
      params: filters,
    });
    return response.data;
  },
};
