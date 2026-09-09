import { describe, expect, it } from 'vitest';
import { parseDurationMs } from './auth.service.js';

describe('parseDurationMs', () => {
  it('parses hour-based session durations', () => {
    expect(parseDurationMs('8h')).toBe(8 * 60 * 60 * 1000);
  });

  it('treats bare numeric values as seconds to match JWT expiresIn semantics', () => {
    expect(parseDurationMs('900')).toBe(15 * 60 * 1000);
  });

  it('falls back to the demo-friendly default for invalid values', () => {
    expect(parseDurationMs('not-a-duration')).toBe(8 * 60 * 60 * 1000);
  });
});
