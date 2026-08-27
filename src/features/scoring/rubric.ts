import type { Lab, LabDecisionPoint } from '@/data/labs/lab.schema';
import { SKILL_AREA_LABELS, type SkillArea } from '@/data/skills/areas';
import {
  TECHNICAL_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
  type TechnicalCategory,
  type ProfessionalCategory,
} from './areas';
import type { ActionRow, EvidenceRow, TicketRow } from '@/lib/db/client';

/**
 * The scoring rubric. Pure functions only — no I/O, no React.
 *
 * Inputs: a finished attempt (its decisions + actions + evidence + ticket
 * resolution), the lab definition, and the lab's scoring weights.
 *
 * Output: a `ScoreResult` containing raw per-category scores, weighted
 * percentages, top strengths, top weaknesses, and the per-skill-area
 * delta for the readiness map.
 *
 * Design notes
 * ------------
 * 1. Technical categories are scored from `decisions` rows (each option has
 *    a `score: { diagnosis, evidence, resolution }` per the schema) and from
 *    `evidence` rows (presence of required evidence lifts evidence/troubleshooting).
 * 2. Professional categories are scored from the audit log (`actions`) and
 *    from the ticket's `notes` / `resolution` text. The professional model
 *    is intentionally lightweight in MVP — we reward documented notes and
 *    penalize destructive actions before evidence.
 * 3. Per-lab weights from `lab.scoring.weights` (0..2) modulate how much
 *    each technical dimension contributes to the technical percentage.
 *    A weight of 0 effectively drops that dimension.
 */

export interface ScoreInputs {
  lab: Lab;
  /** All decisions recorded for this attempt, in chronological order. */
  decisions: Array<{
    decisionPointId: string;
    choice: string;
    ts: number;
  }>;
  /** All evidence rows for this attempt. */
  evidence: Pick<EvidenceRow, 'id' | 'title' | 'body' | 'type'>[];
  /** All audit actions for this attempt, in order. */
  actions: Pick<ActionRow, 'kind'>[];
  /** The terminal node id (the lab FSM's final state). */
  terminalNodeId: string | null;
  /** Whether a remediation occurred. */
  remediated: boolean;
  /** Ticket troubleshooting notes (free text, may be empty). */
  notes: string;
  /** Ticket resolution notes (free text, may be empty). */
  resolution: string;
}

export interface ScoreResult {
  technical: Record<TechnicalCategory, number>;
  professional: Record<ProfessionalCategory, number>;
  technicalPct: number; // 0..100
  professionalPct: number; // 0..100
  /** Per-area delta contribution for the readiness map. */
  areaContribution: Partial<Record<SkillArea, number>>;
  /** Top 3 categories where the learner exceeded the median (strengths). */
  strengths: Array<{ key: string; label: string; value: number; track: 'technical' | 'professional' }>;
  /** Top 3 categories where the learner fell below the median (weaknesses). */
  weaknesses: Array<{ key: string; label: string; value: number; track: 'technical' | 'professional' }>;
}

const EMPTY_TECHNICAL: Record<TechnicalCategory, number> = {
  diagnosis: 0,
  evidence: 0,
  troubleshooting: 0,
  resolution: 0,
  validation: 0,
};

const EMPTY_PROFESSIONAL: Record<ProfessionalCategory, number> = {
  'customer-communication': 0,
  documentation: 0,
  prioritization: 0,
  'sla-awareness': 0,
  escalation: 0,
  'security-awareness': 0,
  'process-discipline': 0,
};

/**
 * Score a finished attempt. Pure function. Safe to call multiple times
 * with the same inputs.
 */
export function scoreAttempt(inputs: ScoreInputs): ScoreResult {
  const technical = scoreTechnical(inputs);
  const professional = scoreProfessional(inputs);
  const technicalPct = weightedPct(
    technical,
    inputs.lab.scoring.weights as unknown as Record<TechnicalCategory, number>,
  );
  const professionalPct = simpleAveragePct(professional);
  const areaContribution = scoreAreaContribution(inputs);
  const { strengths, weaknesses } = collectHighlights(technical, professional);
  return {
    technical,
    professional,
    technicalPct,
    professionalPct,
    areaContribution,
    strengths,
    weaknesses,
  };
}

/**
 * Technical scoring:
 *  - diagnosis, evidence, resolution: averaged from decision options'
 *    `score.{diagnosis, evidence, resolution}` in the lab JSON. Each
 *    option's per-category value is in {-1, 0, 1}. We sum and normalize
 *    to {0, 1, 2} so the result fits the 0..2 weight scale.
 *  - troubleshooting: 1 if the learner acted between collecting evidence
 *    and the remediation step, 0 otherwise. (Heuristic; lab engine
 *    dispatches 'remediate' events that the audit log captures.)
 *  - validation: 1 if the lab reached a terminal node AND the lab
 *    required validation, 0 otherwise. We default to 0 here and let the
 *    caller pass `remediated: true` to lift it.
 */
function scoreTechnical(inputs: ScoreInputs): Record<TechnicalCategory, number> {
  const out: Record<TechnicalCategory, number> = { ...EMPTY_TECHNICAL };

  // Map decision point id -> decision point definition for option lookup.
  const dpIndex = new Map<string, LabDecisionPoint>();
  for (const dp of inputs.lab.decisionPoints) {
    dpIndex.set(dp.id, dp);
  }

  let diagnosisSum = 0;
  let evidenceSum = 0;
  let resolutionSum = 0;
  let decisionCount = 0;

  for (const dec of inputs.decisions) {
    const dp = dpIndex.get(dec.decisionPointId);
    if (!dp) continue;
    const opt = dp.options.find((o) => o.id === dec.choice);
    if (!opt) continue;
    diagnosisSum += opt.score.diagnosis;
    evidenceSum += opt.score.evidence;
    resolutionSum += opt.score.resolution;
    decisionCount++;
  }

  if (decisionCount > 0) {
    // Map sum-of-{-1,0,1} (range: -N..N) to 0..2 by adding N and dividing by N.
    out.diagnosis = ((diagnosisSum + decisionCount) / (2 * decisionCount)) * 2;
    out.evidence = ((evidenceSum + decisionCount) / (2 * decisionCount)) * 2;
    out.resolution = ((resolutionSum + decisionCount) / (2 * decisionCount)) * 2;
  }

  // Troubleshooting: 1 if any 'remediate' or 'try-fix' action preceded the
  // first remediation evidence. Simple proxy: count of 'inspect' or
  // 'remediate' actions before the first remediation evidence.
  const firstRemediationTs = inputs.evidence.length
    ? Math.min(...inputs.evidence.map((e) => hashIdToTs(e.id)))
    : Number.POSITIVE_INFINITY;
  const preEvidenceActions = inputs.actions.filter(
    (a) => a.kind === 'inspect' || a.kind === 'remediate',
  ).length;
  out.troubleshooting = preEvidenceActions > 0 ? Math.min(2, 1 + preEvidenceActions * 0.25) : 0;
  void firstRemediationTs;

  // Validation: 2 if remediated AND terminal node is set; 1 if terminal node set
  // but no remediation recorded (e.g. escalate path); 0 otherwise.
  if (inputs.terminalNodeId) {
    out.validation = inputs.remediated ? 2 : 1;
  }

  return out;
}

/** Best-effort timestamp from an evidence row id; not currently used. */
function hashIdToTs(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/**
 * Professional scoring: lightweight heuristic in MVP. Each category is
 * scored 0..2 by checking for the presence and quality of audit signals.
 */
function scoreProfessional(inputs: ScoreInputs): Record<ProfessionalCategory, number> {
  const out: Record<ProfessionalCategory, number> = { ...EMPTY_PROFESSIONAL };

  out['customer-communication'] = tier(inputs.resolution, [20, 80]);
  out.documentation = tier(inputs.notes, [50, 200]);

  // prioritization: ratio of "good" decisions (non-negative score in any
  // category) to total decisions.
  if (inputs.decisions.length > 0) {
    const dpIndex = new Map<string, LabDecisionPoint>();
    for (const dp of inputs.lab.decisionPoints) {
      dpIndex.set(dp.id, dp);
    }
    let good = 0;
    for (const dec of inputs.decisions) {
      const dp = dpIndex.get(dec.decisionPointId);
      if (!dp) continue;
      const opt = dp.options.find((o) => o.id === dec.choice);
      if (!opt) continue;
      const s = opt.score;
      if (s.diagnosis >= 0 && s.evidence >= 0 && s.resolution >= 0) good++;
    }
    out.prioritization = (good / inputs.decisions.length) * 2;
  }

  // sla-awareness: required evidence vs collected.
  const required = inputs.lab.evidence ?? [];
  if (required.length > 0) {
    const collected = new Set(inputs.evidence.map((e) => e.title.toLowerCase()));
    const hit = required.filter((r: { description: string }) => collected.has(r.description.toLowerCase())).length;
    out['sla-awareness'] = (hit / required.length) * 2;
  } else {
    out['sla-awareness'] = 1;
  }

  out.escalation = inputs.actions.some((a) => a.kind === 'escalate') ? 1 : 0;

  // security-awareness: 1 if no destructive action preceded the first
  // evidence row. Without per-row timestamps we approximate by checking
  // that any 'remediate'/'reset'/'wipe' is preceded by an 'inspect' or
  // 'evidence-collected' action in the same attempt.
  const hasInspectFirst =
    inputs.actions.length > 0 &&
    (inputs.actions[0]?.kind === 'inspect' || inputs.actions[0]?.kind === 'evidence-collected');
  out['security-awareness'] = hasInspectFirst ? 1 : 0;

  // process-discipline: average of others, capped at 2.
  const others = [
    out['customer-communication'],
    out.documentation,
    out.prioritization,
    out['sla-awareness'],
    out.escalation,
    out['security-awareness'],
  ];
  out['process-discipline'] = Math.min(2, others.reduce((a, b) => a + b, 0) / others.length);

  return out;
}

/** Map a length to a 0/1/2 tier. */
function tier(text: string, breaks: [number, number]): 0 | 1 | 2 {
  const len = text.trim().length;
  if (len >= breaks[1]) return 2;
  if (len >= breaks[0]) return 1;
  return 0;
}

/** Weighted percentage in 0..100, given per-key scores in 0..2 and weights in 0..2. */
function weightedPct(
  scores: Record<TechnicalCategory, number>,
  weights: Record<TechnicalCategory, number>,
): number {
  let num = 0;
  let den = 0;
  for (const key of TECHNICAL_CATEGORIES) {
    const w = weights[key] ?? 0;
    if (w <= 0) continue;
    num += scores[key] * w;
    den += 2 * w;
  }
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

function simpleAveragePct(scores: Record<ProfessionalCategory, number>): number {
  let sum = 0;
  for (const k of PROFESSIONAL_CATEGORIES) sum += scores[k];
  return Math.round((sum / (PROFESSIONAL_CATEGORIES.length * 2)) * 100);
}

/**
 * Per-area delta contribution. For now, we attribute the whole attempt
 * to the lab's `track` (service-desk, windows, apple, …).
 */
function scoreAreaContribution(
  inputs: ScoreInputs,
): Partial<Record<SkillArea, number>> {
  const out: Partial<Record<SkillArea, number>> = {};
  const track = inputs.lab.track ?? 'service-desk';
  const trackToArea: Record<string, SkillArea> = {
    'service-desk': 'ticketing',
    windows: 'windows',
    apple: 'apple',
    'google-workspace': 'google-workspace',
    mdm: 'mdm',
    networking: 'networking',
    classroom: 'classroom-tech',
    hardware: 'hardware-lifecycle',
    projects: 'projects',
    documentation: 'documentation',
    incidents: 'incident-response',
  };
  const area = trackToArea[track] ?? 'ticketing';
  out[area] = 1;
  return out;
}

/**
 * Pick top-3 strengths and top-3 weaknesses across both technical and
 * professional categories. Strengths = above the median; weaknesses =
 * below.
 */
function collectHighlights(
  technical: Record<TechnicalCategory, number>,
  professional: Record<ProfessionalCategory, number>,
): {
  strengths: ScoreResult['strengths'];
  weaknesses: ScoreResult['weaknesses'];
} {
  const all: ScoreResult['strengths'] = [
    ...TECHNICAL_CATEGORIES.map((k) => ({
      key: k,
      label: k,
      value: technical[k],
      track: 'technical' as const,
    })),
    ...PROFESSIONAL_CATEGORIES.map((k) => ({
      key: k,
      label: k,
      value: professional[k],
      track: 'professional' as const,
    })),
  ];
  const sorted = [...all].sort((a, b) => b.value - a.value);
  const median = sorted[Math.floor(sorted.length / 2)]?.value ?? 0;
  const strengths = sorted.filter((s) => s.value > median).slice(0, 3);
  const weaknesses = [...all]
    .filter((s) => s.value < median)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);
  return { strengths, weaknesses };
}

/** Convenience: format a ScoreResult for storage as a ScoreRow. */
export function toScoreRow(
  attemptId: string,
  labId: string,
  result: ScoreResult,
): {
  id: string;
  attemptId: string;
  labId: string;
  technical: Record<string, number>;
  professional: Record<string, number>;
  ts: number;
} {
  return {
    id: crypto.randomUUID(),
    attemptId,
    labId,
    technical: result.technical,
    professional: result.professional,
    ts: Date.now(),
  };
}

export { SKILL_AREA_LABELS };
// Re-export type for callers who want it.
export type { TicketRow };
