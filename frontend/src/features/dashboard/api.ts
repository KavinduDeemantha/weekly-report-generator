import { apiClient } from '../../api/client';
import type {
  DashboardActivityItem,
  DashboardSummary,
  ProjectDistributionItem,
  SubmissionStatusItem,
  TaskTrendItem,
  TimeDistributionItem,
} from '../../types/dashboard';
import type { DashboardFilters } from './types';

export const dashboardApi = {
  async getSummary(filters: DashboardFilters) {
    const response = await apiClient.get<DashboardSummary>(
      '/dashboard/summary',
      { params: filters },
    );
    return response.data;
  },

  async getSubmissionStatus(filters: DashboardFilters) {
    const response = await apiClient.get<SubmissionStatusItem[]>(
      '/dashboard/submission-status',
      { params: filters },
    );
    return response.data;
  },

  async getTaskTrends(filters: DashboardFilters) {
    const response = await apiClient.get<TaskTrendItem[]>(
      '/dashboard/task-trends',
      { params: filters },
    );
    return response.data;
  },

  async getProjectDistribution(filters: DashboardFilters) {
    const response = await apiClient.get<ProjectDistributionItem[]>(
      '/dashboard/project-distribution',
      { params: filters },
    );
    return response.data;
  },

  async getTimeDistribution(filters: DashboardFilters) {
    const response = await apiClient.get<TimeDistributionItem[]>(
      '/dashboard/time-distribution',
      { params: filters },
    );
    return response.data;
  },

  async getActivity(filters: DashboardFilters) {
    const response = await apiClient.get<DashboardActivityItem[]>(
      '/dashboard/activity',
      { params: filters },
    );
    return response.data;
  },
};
