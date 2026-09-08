import type { UseFormReturn } from 'react-hook-form';
import type { ReportFormValues } from '../reports/types';
import type {
  ReportAssistantAction,
  ReportAssistantContext,
  ReportAssistantResponse,
} from './types';

export const reportAssistantActionLabels: Record<
  ReportAssistantAction,
  string
> = {
  IMPROVE_WRITING: 'Improve writing',
  SUMMARIZE_WEEK: 'Summarize week',
  IMPROVE_BLOCKERS: 'Improve blockers',
  IMPROVE_ACHIEVEMENTS: 'Improve achievements',
  SUGGEST_NEXT_WEEK: 'Suggest next week',
};

type ReportAssistantFormApi = Pick<
  UseFormReturn<ReportFormValues>,
  'getValues' | 'setValue'
>;

export function buildReportAssistantContext(
  values: ReportFormValues,
  action: ReportAssistantAction,
): ReportAssistantContext {
  const common = {
    notes: normalizeOptionalText(values.notes),
    tasks: values.tasks
      .filter((task) => task.name.trim() || task.deliverable?.trim())
      .map((task) => ({
        ...task,
        name: task.name.trim(),
        deliverable: normalizeOptionalText(task.deliverable),
      })),
  };

  switch (action) {
    case 'IMPROVE_BLOCKERS':
      return {
        ...common,
        blockers: values.blockers
          .filter((blocker) => blocker.description.trim())
          .map((blocker) => ({
            ...blocker,
            description: blocker.description.trim(),
          })),
      };
    case 'IMPROVE_ACHIEVEMENTS':
      return {
        ...common,
        achievements: values.achievements
          .filter((achievement) => achievement.description.trim())
          .map((achievement) => ({
            ...achievement,
            description: achievement.description.trim(),
          })),
      };
    case 'SUGGEST_NEXT_WEEK':
      return {
        ...common,
        blockers: values.blockers
          .filter((blocker) => blocker.description.trim())
          .map((blocker) => ({
            ...blocker,
            description: blocker.description.trim(),
          })),
        achievements: values.achievements
          .filter((achievement) => achievement.description.trim())
          .map((achievement) => ({
            ...achievement,
            description: achievement.description.trim(),
          })),
      };
    case 'IMPROVE_WRITING':
    case 'SUMMARIZE_WEEK':
      return {
        ...common,
        nextWeekTasks: values.nextWeekTasks
          .filter((task) => task.description.trim())
          .map((task) => ({ description: task.description.trim() })),
        blockers: values.blockers
          .filter((blocker) => blocker.description.trim())
          .map((blocker) => ({
            ...blocker,
            description: blocker.description.trim(),
          })),
        achievements: values.achievements
          .filter((achievement) => achievement.description.trim())
          .map((achievement) => ({
            ...achievement,
            description: achievement.description.trim(),
          })),
        timeEntries: values.timeEntries,
      };
  }
}

export function applyReportAssistantSuggestion(
  form: ReportAssistantFormApi,
  response: ReportAssistantResponse,
) {
  const nextValues = getReportValuesAfterAssistantSuggestion(
    form.getValues(),
    response,
  );

  if (
    response.action === 'IMPROVE_WRITING' ||
    response.action === 'SUMMARIZE_WEEK'
  ) {
    form.setValue('notes', nextValues.notes, {
      shouldDirty: true,
      shouldValidate: true,
    });
    return;
  }

  form.setValue(responseTarget(response.action), nextValues[responseTarget(response.action)], {
    shouldDirty: true,
    shouldValidate: true,
  });
}

export function getReportValuesAfterAssistantSuggestion(
  values: ReportFormValues,
  response: ReportAssistantResponse,
): ReportFormValues {
  const suggestions = normalizedSuggestions(response);

  switch (response.action) {
    case 'IMPROVE_WRITING':
    case 'SUMMARIZE_WEEK':
      return {
        ...values,
        notes: response.suggestion,
      };
    case 'IMPROVE_BLOCKERS':
      return {
        ...values,
        blockers: applyItemSuggestions(values.blockers, suggestions, {
          description: '',
          isKeyIssue: false,
          isResolved: false,
        }),
      };
    case 'IMPROVE_ACHIEVEMENTS':
      return {
        ...values,
        achievements: applyItemSuggestions(values.achievements, suggestions, {
          description: '',
          isKeyAchievement: false,
        }),
      };
    case 'SUGGEST_NEXT_WEEK':
      return {
        ...values,
        nextWeekTasks: suggestions.map((description) => ({ description })),
      };
  }
}

function responseTarget(
  action: Exclude<
    ReportAssistantAction,
    'IMPROVE_WRITING' | 'SUMMARIZE_WEEK'
  >,
) {
  switch (action) {
    case 'IMPROVE_BLOCKERS':
      return 'blockers';
    case 'IMPROVE_ACHIEVEMENTS':
      return 'achievements';
    case 'SUGGEST_NEXT_WEEK':
      return 'nextWeekTasks';
  }
}

function normalizedSuggestions(response: ReportAssistantResponse): string[] {
  const suggestions = response.suggestions?.filter(
    (suggestion) => suggestion.trim().length > 0,
  );

  return suggestions?.length ? suggestions : [response.suggestion];
}

function applyItemSuggestions<T extends { description: string }>(
  currentItems: T[],
  suggestions: string[],
  fallbackItem: T,
): T[] {
  const sourceItems = currentItems.length > 0 ? currentItems : [fallbackItem];

  return sourceItems.map((item, index) => ({
    ...item,
    description: suggestions[index] ?? item.description,
  }));
}

function normalizeOptionalText(value: string | undefined) {
  return value?.trim() || undefined;
}
