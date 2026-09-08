import { apiClient } from '../../api/client';
import type { PaginatedReports, ReportDetail } from '../../types/reports';
import type { ManagerReportFilters } from './types';

export const managerReportsApi = {
  async list(filters: ManagerReportFilters) {
    const response = await apiClient.get<PaginatedReports>('/manager/reports', {
      params: filters,
    });
    return response.data;
  },

  async getDetail(id: string) {
    const response = await apiClient.get<ReportDetail>(`/manager/reports/${id}`);
    return response.data;
  },

  async requestChanges(id: string, comment: string) {
    const response = await apiClient.post<ReportDetail>(
      `/manager/reports/${id}/request-changes`,
      { comment },
    );
    return response.data;
  },

  async approve(id: string) {
    const response = await apiClient.post<ReportDetail>(
      `/manager/reports/${id}/approve`,
    );
    return response.data;
  },
};
