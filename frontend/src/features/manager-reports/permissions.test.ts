import { describe, expect, it } from 'vitest';
import { canReviewReportStatus } from './permissions';

describe('manager report review permissions', () => {
  it('shows review actions only for submitted reports', () => {
    expect(canReviewReportStatus('SUBMITTED')).toBe(true);
    expect(canReviewReportStatus('DRAFT')).toBe(false);
    expect(canReviewReportStatus('NEEDS_CORRECTION')).toBe(false);
    expect(canReviewReportStatus('APPROVED')).toBe(false);
  });
});
