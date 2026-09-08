import { describe, expect, it } from 'vitest';
import { projectFormSchema } from './schemas';

describe('project form schema', () => {
  it('requires a useful project name', () => {
    const result = projectFormSchema.safeParse({
      name: 'A',
      description: '',
      isActive: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects overlong descriptions before hitting the backend', () => {
    const result = projectFormSchema.safeParse({
      name: 'Client Portal',
      description: 'x'.repeat(501),
      isActive: true,
    });

    expect(result.success).toBe(false);
  });
});
