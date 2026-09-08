import { z } from 'zod';

export const requestChangesSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Comment is required.')
    .max(2000, 'Comment must be 2000 characters or less.'),
});

export type RequestChangesValues = z.infer<typeof requestChangesSchema>;
