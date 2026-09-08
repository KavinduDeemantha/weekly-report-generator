import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters.')
    .max(120, 'Project name must be 120 characters or less.'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less.')
    .optional(),
  isActive: z.boolean().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
