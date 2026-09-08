import { apiClient } from '../../api/client';
import type { PaginatedReports } from '../../types/reports';

export const reportsApi = {
  async listMine() {
    const response = await apiClient.get<PaginatedReports>('/reports/me', {
      params: { page: 1, limit: 5 },
    });
    return response.data;
  },
};
