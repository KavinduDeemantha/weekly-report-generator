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
