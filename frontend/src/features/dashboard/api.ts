import { apiClient } from '../../api/client';
import type { DashboardSummary } from '../../types/dashboard';

export const dashboardApi = {
  async getSummary() {
    const response = await apiClient.get<DashboardSummary>(
      '/dashboard/summary',
    );
    return response.data;
  },
};
