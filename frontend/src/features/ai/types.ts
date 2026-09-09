import type { ReportFormValues } from '../reports/types';

export type ReportAssistantAction =
  | 'IMPROVE_WRITING'
  | 'SUMMARIZE_WEEK'
  | 'IMPROVE_BLOCKERS'
  | 'IMPROVE_ACHIEVEMENTS'
  | 'SUGGEST_NEXT_WEEK';

export type ReportAssistantContext = Partial<
  Pick<
    ReportFormValues,
    | 'tasks'
    | 'nextWeekTasks'
    | 'blockers'
    | 'achievements'
    | 'timeEntries'
    | 'notes'
  >
>;

export type ReportAssistantRequest = {
  action: ReportAssistantAction;
  context: ReportAssistantContext;
};

export type ReportAssistantResponse = {
  action: ReportAssistantAction;
  suggestion: string;
  suggestions?: string[];
};

export type ManagerChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ManagerChatFilters = {
  weekStart?: string;
  from?: string;
  to?: string;
  userId?: string;
  projectId?: string;
};

export type ManagerChatRequest = {
  message: string;
  filters?: ManagerChatFilters;
  history?: ManagerChatMessage[];
};

export type ManagerChatResponse = {
  answer: string;
  scope: {
    mode: 'week' | 'range';
    weekStart?: string;
    from?: string;
    to?: string;
  };
  sources: {
    reportCount: number;
    memberCount: number;
  };
  relatedReports?: {
    reportId: string;
    memberName: string;
    projectName: string;
  }[];
};
