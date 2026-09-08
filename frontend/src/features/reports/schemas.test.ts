import { describe, expect, it } from 'vitest';
import { reportFormSchema } from './schemas';
import type { ReportFormValues } from './types';

const validReport: ReportFormValues = {
  weekStart: '2026-09-07',
  weekEnd: '2026-09-13',
  projectId: '00000000-0000-0000-0000-000000000000',
  notes: 'Progress notes',
  tasks: [
    {
      name: 'Build report UI',
      priority: 'HIGH',
      plannedPercentage: 100,
      actualPercentage: 75,
      status: 'IN_PROGRESS',
      plannedHours: 8,
      actualHours: 6,
      deliverable: 'Report form',
    },
  ],
  nextWeekTasks: [{ description: 'Finish report detail' }],
  blockers: [{ description: 'Waiting on copy', isKeyIssue: true, isResolved: false }],
  achievements: [
    {
      description: 'Completed authentication shell',
      isKeyAchievement: true,
    },
  ],
  timeEntries: [{ type: 'DEVELOPMENT', hours: 6 }],
};

describe('report form schema', () => {
  it('rejects a week end before week start', () => {
    const result = reportFormSchema.safeParse({
      ...validReport,
      weekEnd: '2026-09-01',
    });

    expect(result.success).toBe(false);
  });

  it('rejects multiple key blockers', () => {
    const result = reportFormSchema.safeParse({
      ...validReport,
      blockers: [
        { description: 'First blocker', isKeyIssue: true, isResolved: false },
        { description: 'Second blocker', isKeyIssue: true, isResolved: false },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects multiple key achievements', () => {
    const result = reportFormSchema.safeParse({
      ...validReport,
      achievements: [
        { description: 'First win', isKeyAchievement: true },
        { description: 'Second win', isKeyAchievement: true },
      ],
    });

    expect(result.success).toBe(false);
  });
});
