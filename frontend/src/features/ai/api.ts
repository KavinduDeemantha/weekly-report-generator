import { apiClient } from '../../api/client';
import type {
  ReportAssistantRequest,
  ReportAssistantResponse,
} from './types';

export const aiApi = {
  async getReportSuggestion(request: ReportAssistantRequest) {
    const response = await apiClient.post<ReportAssistantResponse>(
      '/ai/report-assistant',
      request,
    );
    return response.data;
  },
};
