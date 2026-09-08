import { apiClient } from '../../api/client';
import type {
  PaginatedReports,
  ReportDetail,
  ReportVersionDetail,
  ReportVersionSummary,
} from '../../types/reports';
import type { ReportFormValues, ReportListFilters } from './types';

export const reportsApi = {
  async listMine(filters: ReportListFilters) {
    const response = await apiClient.get<PaginatedReports>('/reports/me', {
      params: filters,
    });
    return response.data;
  },

  async getDetail(id: string) {
    const response = await apiClient.get<ReportDetail>(`/reports/${id}`);
    return response.data;
  },

  async create(values: ReportFormValues) {
    const response = await apiClient.post<ReportDetail>(
      '/reports',
      toReportPayload(values),
    );
    return response.data;
  },

  async update(id: string, values: ReportFormValues) {
    const response = await apiClient.patch<ReportDetail>(
      `/reports/${id}`,
      toReportPayload(values),
    );
    return response.data;
  },

  async submit(id: string) {
    const response = await apiClient.post<ReportDetail>(
      `/reports/${id}/submit`,
    );
    return response.data;
  },

  async resubmit(id: string) {
    const response = await apiClient.post<ReportDetail>(
      `/reports/${id}/resubmit`,
    );
    return response.data;
  },

  async listVersions(id: string) {
    const response = await apiClient.get<ReportVersionSummary[]>(
      `/reports/${id}/versions`,
    );
    return response.data;
  },

  async getVersion(id: string, versionNumber: number) {
    const response = await apiClient.get<ReportVersionDetail>(
      `/reports/${id}/versions/${versionNumber}`,
    );
    return response.data;
  },
};

function toReportPayload(values: ReportFormValues) {
  return {
    weekStart: values.weekStart,
    weekEnd: values.weekEnd,
    projectId: values.projectId,
    notes: values.notes?.trim() ? values.notes.trim() : undefined,
    tasks: values.tasks.map((task) => ({
      ...task,
      name: task.name.trim(),
      deliverable: task.deliverable?.trim() || undefined,
    })),
    nextWeekTasks: values.nextWeekTasks.map((task) => ({
      description: task.description.trim(),
    })),
    blockers: values.blockers.map((blocker) => ({
      description: blocker.description.trim(),
      isKeyIssue: blocker.isKeyIssue,
      isResolved: blocker.isResolved,
    })),
    achievements: values.achievements.map((achievement) => ({
      description: achievement.description.trim(),
      isKeyAchievement: achievement.isKeyAchievement,
    })),
    timeEntries: values.timeEntries,
  };
}
