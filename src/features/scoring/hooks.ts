import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/lib/db/client';
import { recomputeReadiness, READINESS_THRESHOLDS } from './readiness';
import {
  SKILL_AREAS,
  type SkillArea,
  type ReadinessLevel,
} from '@/data/skills/areas';

export interface AreaReadiness {
  level: ReadinessLevel;
  evidenceCount: number;
  nextLevel: ReadinessLevel | null;
  /** How many more evidence-backed attempts are needed for the next level. */
  evidenceNeeded: number;
  /** Threshold pct for the current level's mean technical requirement. */
  currentPctThreshold: number;
}

const LEVEL_ORDER: readonly ReadinessLevel[] = [
  'not-started',
  'learning',
  'developing',
  'job-ready',
  'strong',
];

/** Returns the next level above the given one, or null if it's already the top. */
function nextLevel(level: ReadinessLevel): ReadinessLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1] ?? null;
}

function pctForLevel(level: ReadinessLevel): number {
  switch (level) {
    case 'not-started':
      return 0;
    case 'learning':
      return 0;
    case 'developing':
      return READINESS_THRESHOLDS.developing;
    case 'job-ready':
      return READINESS_THRESHOLDS.jobReadyPct;
    case 'strong':
      return READINESS_THRESHOLDS.strongPct;
  }
}

function evidenceForLevel(level: ReadinessLevel): number {
  switch (level) {
    case 'not-started':
      return 0;
    case 'learning':
      return 0;
    case 'developing':
      return 0;
    case 'job-ready':
      return READINESS_THRESHOLDS.jobReady;
    case 'strong':
      return READINESS_THRESHOLDS.strong;
  }
}

function buildReadiness(evidenceCount: number, level: ReadinessLevel): AreaReadiness {
  const next = nextLevel(level);
  return {
    level,
    evidenceCount,
    nextLevel: next,
    evidenceNeeded: next ? Math.max(0, evidenceForLevel(next) - evidenceCount) : 0,
    currentPctThreshold: pctForLevel(level),
  };
}

/**
 * Live readiness map for a profile. Triggers a recompute on mount and whenever
 * the attempts table changes for this profile.
 */
export function useReadinessMap(profileId: string | null | undefined): Map<SkillArea, AreaReadiness> {
  const [map, setMap] = useState<Map<SkillArea, AreaReadiness>>(
    () => new Map(SKILL_AREAS.map((a) => [a, buildReadiness(0, 'not-started')])),
  );

  const attempts = useLiveQuery(
    () => (profileId ? db.attempts.where('profileId').equals(profileId).toArray() : []),
    [profileId],
  );

  useEffect(() => {
    let cancelled = false;
    async function recompute() {
      if (!profileId) return;
      const rows = await recomputeReadiness(profileId);
      if (cancelled) return;
      const next = new Map<SkillArea, AreaReadiness>();
      for (const area of SKILL_AREAS) {
        const row = rows.find((r) => r.area === area);
        if (row) {
          next.set(area, buildReadiness(row.evidenceCount, row.level));
        } else {
          next.set(area, buildReadiness(0, 'not-started'));
        }
      }
      setMap(next);
    }
    void recompute();
    return () => {
      cancelled = true;
    };
  }, [profileId, attempts]);

  return map;
}
