import { LAB_MANIFEST, type ManifestEntry } from '@/data/labs/manifest';

/** Default unlock threshold: 80% of phase labs. Tunable per deployment. */
export const DEFAULT_CAPSTONE_THRESHOLD = 0.8;

export interface CapstoneGateStatus {
  /** Capstone entry the gate guards. */
  capstone: ManifestEntry;
  /** Phase labs the learner must finish (excludes the capstone itself). */
  required: ManifestEntry[];
  /** IDs of phase labs the learner has completed. */
  completed: string[];
  /** IDs of phase labs still outstanding. */
  remaining: string[];
  /** Fraction of required labs completed, in [0, 1]. */
  progressPct: number;
  /** Threshold in [0, 1] above which the gate opens. */
  threshold: number;
  /** True if the learner has cleared the threshold. */
  unlocked: boolean;
  /** Additional labs required to reach the threshold (rounded up). */
  labsNeeded: number;
}

export interface GateOptions {
  /** Unlock threshold in [0, 1]. Default 0.8. */
  threshold?: number;
}

/**
 * Capstone gate logic. Pure function — no I/O.
 *
 * The gate is `unlocked` once the learner's completion ratio crosses
 * `threshold`. The default is 80% so a single unfinished lab doesn't block
 * the capstone; stricter deployments can pass `threshold: 1`.
 */
export function evaluateCapstoneGate(
  capstone: ManifestEntry,
  completedLabIds: readonly string[],
  options: GateOptions = {},
): CapstoneGateStatus {
  const threshold = clamp01(options.threshold ?? DEFAULT_CAPSTONE_THRESHOLD);
  const required = LAB_MANIFEST.filter(
    (l) => l.id !== capstone.id && l.contentPath !== null,
  );
  const completedSet = new Set(completedLabIds);
  const completed = required
    .filter((l) => completedSet.has(l.id))
    .map((l) => l.id);
  const remaining = required
    .filter((l) => !completedSet.has(l.id))
    .map((l) => l.id);
  const progressPct = required.length === 0 ? 1 : completed.length / required.length;
  const labsNeeded = Math.max(0, Math.ceil(threshold * required.length) - completed.length);
  return {
    capstone,
    required,
    completed,
    remaining,
    progressPct,
    threshold,
    unlocked: progressPct >= threshold,
    labsNeeded,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return DEFAULT_CAPSTONE_THRESHOLD;
  return Math.max(0, Math.min(1, n));
}

