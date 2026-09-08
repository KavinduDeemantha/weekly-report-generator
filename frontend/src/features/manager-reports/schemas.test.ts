import { describe, expect, it } from 'vitest';
import { requestChangesSchema } from './schemas';

describe('request changes schema', () => {
  it('requires a non-empty comment', () => {
    const result = requestChangesSchema.safeParse({ comment: '   ' });

    expect(result.success).toBe(false);
  });

  it('accepts and trims a valid comment', () => {
    const result = requestChangesSchema.safeParse({
      comment: '  Please clarify the deliverable.  ',
    });

    expect(result.success).toBe(true);
    expect(result.data?.comment).toBe('Please clarify the deliverable.');
  });
});
