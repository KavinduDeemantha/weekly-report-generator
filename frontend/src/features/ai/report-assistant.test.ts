import { describe, expect, it, vi } from 'vitest';
import type { UseFormReturn } from 'react-hook-form';
import {
  applyReportAssistantSuggestion,
  buildReportAssistantContext,
  getReportValuesAfterAssistantSuggestion,
} from './report-assistant';
import type { ReportFormValues } from '../reports/types';

const reportValues: ReportFormValues = {
  weekStart: '2026-09-07',
  weekEnd: '2026-09-13',
  projectId: '00000000-0000-0000-0000-000000000000',
  notes: 'worked on auth and report pages',
  tasks: [
    {
      name: 'Implement report form',
      priority: 'HIGH',
      plannedPercentage: 100,
      actualPercentage: 80,
      status: 'IN_PROGRESS',
      plannedHours: 8,
      actualHours: 7,
      deliverable: 'Report form',
    },
  ],
  nextWeekTasks: [{ description: 'Finish dashboard polish' }],
  blockers: [
    {
      description: 'Waiting for production credentials',
      isKeyIssue: true,
      isResolved: false,
    },
  ],
  achievements: [
    {
      description: 'Completed auth flow',
      isKeyAchievement: true,
    },
  ],
  timeEntries: [{ type: 'DEVELOPMENT', hours: 7 }],
};

describe('report assistant helpers', () => {
  it('builds action-specific context without client-controlled report metadata', () => {
    const context = buildReportAssistantContext(
      reportValues,
      'IMPROVE_BLOCKERS',
    );

    expect(context).toEqual({
      notes: reportValues.notes,
      tasks: reportValues.tasks,
      blockers: reportValues.blockers,
    });
    expect(context).not.toHaveProperty('userId');
    expect(context).not.toHaveProperty('status');
    expect(context).not.toHaveProperty('currentVersion');
  });

  it('does not mutate form values until an apply helper is used', () => {
    const before = structuredClone(reportValues);

    buildReportAssistantContext(reportValues, 'SUMMARIZE_WEEK');

    expect(reportValues).toEqual(before);
  });

  it('applies writing suggestions to notes', () => {
    const nextValues = getReportValuesAfterAssistantSuggestion(reportValues, {
      action: 'IMPROVE_WRITING',
      suggestion: 'Implemented the report form and continued dashboard polish.',
    });

    expect(nextValues.notes).toBe(
      'Implemented the report form and continued dashboard polish.',
    );
    expect(nextValues.tasks).toEqual(reportValues.tasks);
  });

  it('applies item-level blocker suggestions while preserving flags', () => {
    const nextValues = getReportValuesAfterAssistantSuggestion(reportValues, {
      action: 'IMPROVE_BLOCKERS',
      suggestion: 'Clarified blocker wording.',
      suggestions: ['Production credentials are still pending.'],
    });

    expect(nextValues.blockers).toEqual([
      {
        description: 'Production credentials are still pending.',
        isKeyIssue: true,
        isResolved: false,
      },
    ]);
  });

  it('uses React Hook Form setValue only when applying the suggestion', () => {
    const getValues = (() => reportValues) as UseFormReturn<ReportFormValues>['getValues'];
    const setValue = vi.fn() as UseFormReturn<ReportFormValues>['setValue'];

    applyReportAssistantSuggestion(
      {
        getValues,
        setValue,
      },
      {
        action: 'SUGGEST_NEXT_WEEK',
        suggestion: 'Suggested next-week tasks.',
        suggestions: ['Finalize QA checklist', 'Prepare demo walkthrough'],
      },
    );

    expect(setValue).toHaveBeenCalledWith(
      'nextWeekTasks',
      [
        { description: 'Finalize QA checklist' },
        { description: 'Prepare demo walkthrough' },
      ],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  });
});
