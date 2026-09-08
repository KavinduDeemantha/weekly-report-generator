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
