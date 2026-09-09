import { describe, expect, it } from 'vitest';
import {
  createInitialFilters,
  filtersToSearchParams,
} from './ManagerReportsPage';

describe('ManagerReportsPage URL filters', () => {
  it('initializes recognized report filters from URL parameters', () => {
    const filters = createInitialFilters(
      new URLSearchParams(
        'status=NEEDS_CORRECTION&userId=00000000-0000-4000-8000-000000000001&projectId=00000000-0000-4000-8000-000000000002&weekStart=2026-09-07&page=2&limit=20',
      ),
    );

    expect(filters).toEqual({
      page: 2,
      limit: 20,
      status: 'NEEDS_CORRECTION',
      statusIn: undefined,
      userId: '00000000-0000-4000-8000-000000000001',
      projectId: '00000000-0000-4000-8000-000000000002',
      weekStart: '2026-09-07',
      from: undefined,
      to: undefined,
    });
  });

  it('handles malformed query parameters safely', () => {
    const filters = createInitialFilters(
      new URLSearchParams(
        'status=BAD&statusIn=SUBMITTED,BAD&userId=nope&projectId=nope&weekStart=09-07-2026&page=-2&limit=abc',
      ),
    );

    expect(filters).toEqual({
      page: 1,
      limit: 10,
      status: undefined,
      statusIn: undefined,
      userId: undefined,
      projectId: undefined,
      weekStart: undefined,
      from: undefined,
      to: undefined,
    });
  });

  it('serializes cleared filters to an empty query string', () => {
    expect(
      filtersToSearchParams({
        page: 1,
        limit: 10,
      }).toString(),
    ).toBe('');
  });

  it('serializes statusIn and never sends stale range values with weekStart', () => {
    expect(
      filtersToSearchParams({
        page: 1,
        limit: 10,
        statusIn: 'SUBMITTED,NEEDS_CORRECTION,APPROVED',
        weekStart: '2026-09-07',
        from: '2026-09-01',
        to: '2026-09-30',
      }).toString(),
    ).toBe(
      'statusIn=SUBMITTED%2CNEEDS_CORRECTION%2CAPPROVED&weekStart=2026-09-07',
    );
  });
});
