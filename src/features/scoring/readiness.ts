import { db } from '@/lib/db/client';
import type { ReadinessRow } from '@/lib/db/client';
import { SKILL_AREAS, type SkillArea, type ReadinessLevel } from '@/data/skills/areas';
import { scoreAttempt, type ScoreInputs } from './rubric';

const THRESHOLDS = {
  /** Number of evidence-backed attempts before an area can be 'job-ready'. */
  jobReady: 3,
  /** Number of evidence-backed attempts before 'strong'. */
  strong: 6,
  /** Minimum mean technical pct before 'developing'. */
  developing: 50,
  /** Minimum mean technical pct before 'job-ready'. */
  jobReadyPct: 65,
  /** Minimum mean technical pct before 'strong'. */
  strongPct: 80,
};

/**
 * Recompute the readiness map for a profile and persist one ReadinessRow
 * per skill area. Idempotent.
 */
export async function recomputeReadiness(profileId: string): Promise<ReadinessRow[]> {
  const rows = await collectAttemptScores(profileId);
  const byArea = new Map<SkillArea, AttemptScoreSummary[]>();
  for (const area of SKILL_AREAS) byArea.set(area, []);
  for (const row of rows) {
    const area = row.area;
    const bucket = byArea.get(area);
    if (bucket) bucket.push(row);
  }
  const now = Date.now();
  const results: ReadinessRow[] = [];
  for (const area of SKILL_AREAS) {
    const bucket = byArea.get(area) ?? [];
    const level = classifyArea(bucket);
    const row: ReadinessRow = {
      id: `${profileId}::${area}`,
      profileId,
      area,
      level,
      evidenceCount: bucket.length,
      updatedAt: now,
    };
    results.push(row);
  }
  await db.readiness.bulkPut(results);
  return results;
}

interface AttemptScoreSummary {
  area: SkillArea;
  technicalPct: number;
  professionalPct: number;
}

async function collectAttemptScores(profileId: string): Promise<AttemptScoreSummary[]> {
  const attempts = await db.attempts.where('profileId').equals(profileId).toArray();
  const out: AttemptScoreSummary[] = [];
  for (const att of attempts) {
    if (!att.completedAt) continue;
    const lab = await db.labs.get(att.labId);
    if (!lab) continue;
    const result = await scoreAttemptFromDb(att.id, lab);
    if (!result) continue;
    const area = trackToArea(lab.track);
    out.push({
      area,
      technicalPct: result.technicalPct,
      professionalPct: result.professionalPct,
    });
  }
  return out;
}

async function scoreAttemptFromDb(
  attemptId: string,
  lab: import('@/data/labs/lab.schema').Lab,
): Promise<ReturnType<typeof scoreAttempt> | null> {
  const [decisions, evidence, actions, ticket] = await Promise.all([
    db.decisions.where('attemptId').equals(attemptId).toArray(),
    db.evidence.where('attemptId').equals(attemptId).toArray(),
    db.actions.where('attemptId').equals(attemptId).toArray(),
    db.tickets.where('attemptId').equals(attemptId).first(),
  ]);
  const state = await db.attemptState.get(attemptId);
  const inputs: ScoreInputs = {
    lab: lab as unknown as ScoreInputs['lab'],
    decisions: decisions.map((d) => ({
      decisionPointId: d.decisionPointId,
      choice: d.choice,
      ts: d.ts,
    })),
    evidence: evidence.map((e) => ({
      id: e.id,
      title: e.title,
      body: e.body,
      type: e.type,
    })),
    actions: actions.map((a) => ({ kind: a.kind })),
    terminalNodeId: state?.node ?? null,
    remediated:
      actions.some((a) => a.kind === 'remediate') ||
      evidence.some((e) => e.type === 'command-output'),
    notes: ticket?.notes ?? '',
    resolution: ticket?.resolution ?? '',
  };
  return scoreAttempt(inputs);
}

function classifyArea(scores: AttemptScoreSummary[]): ReadinessLevel {
  if (scores.length === 0) return 'not-started';
  const meanTech =
    scores.reduce((s, a) => s + a.technicalPct, 0) / scores.length;
  if (scores.length >= THRESHOLDS.strong && meanTech >= THRESHOLDS.strongPct) {
    return 'strong';
  }
  if (scores.length >= THRESHOLDS.jobReady && meanTech >= THRESHOLDS.jobReadyPct) {
    return 'job-ready';
  }
  if (meanTech >= THRESHOLDS.developing) {
    return 'developing';
  }
  return 'learning';
}

function trackToArea(track: string | undefined): SkillArea {
  switch (track) {
    case 'windows':
      return 'windows';
    case 'apple':
      return 'apple';
    case 'google-workspace':
      return 'google-workspace';
    case 'mdm':
      return 'mdm';
    case 'network':
      return 'networking';
    case 'classroom-tech':
      return 'classroom-tech';
    case 'asset':
      return 'hardware-lifecycle';
    case 'projects':
      return 'projects';
    case 'documentation':
      return 'documentation';
    case 'incident-response':
      return 'incident-response';
    case 'operations':
      return 'documentation'; // documentation/operations is a meta-skill
    case 'service-desk':
      return 'ticketing';
    default:
      return 'ticketing';
  }
}

export async function getReadinessMap(
  profileId: string,
): Promise<ReadinessRow[]> {
  return db.readiness.where('profileId').equals(profileId).toArray();
}

export const READINESS_THRESHOLDS = THRESHOLDS;
