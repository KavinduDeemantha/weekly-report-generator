import type { ReportDetail } from '../../types/reports';
import type { ReportFormValues } from './types';

export const defaultReportValues: ReportFormValues = {
  weekStart: '',
  weekEnd: '',
  projectId: '',
  notes: '',
  tasks: [
    {
      name: '',
      priority: 'MEDIUM',
      plannedPercentage: 100,
      actualPercentage: 0,
      status: 'IN_PROGRESS',
      plannedHours: 0,
      actualHours: 0,
      deliverable: '',
    },
  ],
  nextWeekTasks: [{ description: '' }],
  blockers: [],
  achievements: [],
  timeEntries: [{ type: 'DEVELOPMENT', hours: 0 }],
};

export function reportDetailToFormValues(report: ReportDetail): ReportFormValues {
  return {
    weekStart: toDateInput(report.weekStart),
    weekEnd: toDateInput(report.weekEnd),
    projectId: report.project.id,
    notes: report.version.notes ?? '',
    tasks:
      report.version.tasks.length > 0
        ? report.version.tasks.map((task) => ({
            name: task.name,
            priority: task.priority,
            plannedPercentage: task.plannedPercentage,
            actualPercentage: task.actualPercentage,
            status: task.status,
            plannedHours: task.plannedHours ?? 0,
            actualHours: task.actualHours ?? 0,
            deliverable: task.deliverable ?? '',
          }))
        : defaultReportValues.tasks,
    nextWeekTasks: report.version.nextWeekTasks.map((task) => ({
      description: task.description,
    })),
    blockers: report.version.blockers.map((blocker) => ({
      description: blocker.description,
      isKeyIssue: blocker.isKeyIssue,
      isResolved: blocker.isResolved,
    })),
    achievements: report.version.achievements.map((achievement) => ({
      description: achievement.description,
      isKeyAchievement: achievement.isKeyAchievement,
    })),
    timeEntries:
      report.version.timeEntries.length > 0
        ? report.version.timeEntries.map((entry) => ({
            type: entry.type,
            hours: entry.hours,
          }))
        : defaultReportValues.timeEntries,
  };
}

export function toDateInput(value: string) {
  return value.slice(0, 10);
}
