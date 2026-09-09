export enum ReportAssistantAction {
  IMPROVE_WRITING = 'IMPROVE_WRITING',
  SUMMARIZE_WEEK = 'SUMMARIZE_WEEK',
  IMPROVE_BLOCKERS = 'IMPROVE_BLOCKERS',
  IMPROVE_ACHIEVEMENTS = 'IMPROVE_ACHIEVEMENTS',
  SUGGEST_NEXT_WEEK = 'SUGGEST_NEXT_WEEK',
}

export type ReportAssistantResponse = {
  action: ReportAssistantAction;
  suggestion: string;
  suggestions?: string[];
};

export enum ManagerChatIntent {
  TEAM_SUMMARY = 'TEAM_SUMMARY',
  OPEN_BLOCKERS = 'OPEN_BLOCKERS',
  SUBMISSION_STATUS = 'SUBMISSION_STATUS',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
  PROJECT_WORKLOAD = 'PROJECT_WORKLOAD',
  MEMBER_ACTIVITY = 'MEMBER_ACTIVITY',
  RECENT_ACTIVITY = 'RECENT_ACTIVITY',
  GENERAL_TEAM_QA = 'GENERAL_TEAM_QA',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
}

export type ManagerChatRole = 'user' | 'assistant';

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
