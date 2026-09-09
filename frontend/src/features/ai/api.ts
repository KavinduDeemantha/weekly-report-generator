import { apiClient } from '../../api/client';
import type {
  ManagerChatRequest,
  ManagerChatResponse,
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

  async askManagerChat(request: ManagerChatRequest) {
    const response = await apiClient.post<ManagerChatResponse>(
      '/ai/manager-chat',
      request,
    );
    return response.data;
  },
};
