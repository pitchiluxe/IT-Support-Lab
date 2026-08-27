/**
 * The 5 technical and 7 professional scoring categories, derived from
 * MASTER_PROMPT_FOR_CLAUDE.md ("SCORING" section). These names are the
 * canonical keys used in ScoreRow.technical / ScoreRow.professional.
 *
 * Do not rename a key without a Dexie migration: ScoreRow data written
 * under the old key would become unreadable.
 */
export const TECHNICAL_CATEGORIES = [
  'diagnosis',
  'evidence',
  'troubleshooting',
  'resolution',
  'validation',
] as const;

export type TechnicalCategory = (typeof TECHNICAL_CATEGORIES)[number];

export const PROFESSIONAL_CATEGORIES = [
  'customer-communication',
  'documentation',
  'prioritization',
  'sla-awareness',
  'escalation',
  'security-awareness',
  'process-discipline',
] as const;

export type ProfessionalCategory = (typeof PROFESSIONAL_CATEGORIES)[number];

export const TECHNICAL_LABELS: Record<TechnicalCategory, string> = {
  diagnosis: 'Diagnosis',
  evidence: 'Evidence',
  troubleshooting: 'Troubleshooting',
  resolution: 'Resolution',
  validation: 'Validation',
};

export const PROFESSIONAL_LABELS: Record<ProfessionalCategory, string> = {
  'customer-communication': 'Customer Communication',
  documentation: 'Documentation',
  prioritization: 'Prioritization',
  'sla-awareness': 'SLA Awareness',
  escalation: 'Escalation',
  'security-awareness': 'Security Awareness',
  'process-discipline': 'Process Discipline',
};
