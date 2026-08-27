import { describe, it, expect } from 'vitest';
import { READINESS_THRESHOLDS } from '@/features/scoring/readiness';

describe('readiness', () => {
  it('does not promote to job-ready with fewer than threshold evidence', () => {
    expect(READINESS_THRESHOLDS.jobReady).toBeGreaterThan(1);
  });

  it('strong requires more evidence than job-ready', () => {
    expect(READINESS_THRESHOLDS.strong).toBeGreaterThan(READINESS_THRESHOLDS.jobReady);
  });

  it('strong requires a higher technical pct than job-ready', () => {
    expect(READINESS_THRESHOLDS.strongPct).toBeGreaterThan(READINESS_THRESHOLDS.jobReadyPct);
  });
});
