import { describe, expect, it } from 'vitest';
import {
  canEditReportStatus,
  canResubmitReportStatus,
  canSubmitReportStatus,
} from './permissions';

describe('report status permissions', () => {
  it('allows editing only draft and correction reports', () => {
    expect(canEditReportStatus('DRAFT')).toBe(true);
    expect(canEditReportStatus('NEEDS_CORRECTION')).toBe(true);
    expect(canEditReportStatus('SUBMITTED')).toBe(false);
    expect(canEditReportStatus('APPROVED')).toBe(false);
  });

  it('separates submit and resubmit actions by state', () => {
    expect(canSubmitReportStatus('DRAFT')).toBe(true);
    expect(canSubmitReportStatus('NEEDS_CORRECTION')).toBe(false);
    expect(canResubmitReportStatus('NEEDS_CORRECTION')).toBe(true);
    expect(canResubmitReportStatus('APPROVED')).toBe(false);
  });
});
