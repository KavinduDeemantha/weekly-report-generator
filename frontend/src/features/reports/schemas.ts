import { z } from 'zod';

export const reportStatuses = [
  'DRAFT',
  'SUBMITTED',
  'NEEDS_CORRECTION',
  'APPROVED',
] as const;

export const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const taskStatuses = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
] as const;
export const timeEntryTypes = [
  'DEVELOPMENT',
  'TESTING',
  'MEETINGS',
  'DOCUMENTATION',
  'OTHER',
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => value?.trim() || undefined);

export const reportFormSchema = z
  .object({
    weekStart: z.string().min(1, 'Week start is required.'),
    weekEnd: z.string().min(1, 'Week end is required.'),
    projectId: z.string().uuid('Choose a project.'),
    notes: optionalText(2000),
    tasks: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(2, 'Task name must be at least 2 characters.')
            .max(200, 'Task name must be 200 characters or less.'),
          priority: z.enum(taskPriorities),
          plannedPercentage: z.coerce
            .number()
            .int('Use a whole percentage.')
            .min(0)
            .max(100),
          actualPercentage: z.coerce
            .number()
            .int('Use a whole percentage.')
            .min(0)
            .max(100),
          status: z.enum(taskStatuses),
          plannedHours: z.coerce.number().min(0).optional(),
          actualHours: z.coerce.number().min(0).optional(),
          deliverable: optionalText(500),
        }),
      )
      .min(1, 'Add at least one task.'),
    nextWeekTasks: z.array(
      z.object({
        description: z
          .string()
          .trim()
          .min(2, 'Description must be at least 2 characters.')
          .max(500),
      }),
    ),
    blockers: z.array(
      z.object({
        description: z
          .string()
          .trim()
          .min(2, 'Description must be at least 2 characters.')
          .max(500),
        isKeyIssue: z.boolean(),
        isResolved: z.boolean(),
      }),
    ),
    achievements: z.array(
      z.object({
        description: z
          .string()
          .trim()
          .min(2, 'Description must be at least 2 characters.')
          .max(500),
        isKeyAchievement: z.boolean(),
      }),
    ),
    timeEntries: z.array(
      z.object({
        type: z.enum(timeEntryTypes),
        hours: z.coerce.number().min(0, 'Hours cannot be negative.'),
      }),
    ),
  })
  .refine((data) => new Date(data.weekEnd) >= new Date(data.weekStart), {
    path: ['weekEnd'],
    message: 'Week end must be on or after week start.',
  })
  .refine((data) => data.blockers.filter((blocker) => blocker.isKeyIssue).length <= 1, {
    path: ['blockers'],
    message: 'Only one blocker can be marked as the key issue.',
  })
  .refine(
    (data) =>
      data.achievements.filter((achievement) => achievement.isKeyAchievement)
        .length <= 1,
    {
      path: ['achievements'],
      message: 'Only one achievement can be marked as the key achievement.',
    },
  );
