/**
 * The 13 readiness skill areas. Single source of truth — imported everywhere.
 * If a new area is added, update this file and bump the schema version.
 */
export const SKILL_AREAS = [
  'apple',
  'windows',
  'google-workspace',
  'mdm',
  'networking',
  'ticketing',
  'classroom-tech',
  'hardware-lifecycle',
  'customer-service',
  'projects',
  'documentation',
  'incident-response',
  'security-awareness',
] as const;

export type SkillArea = (typeof SKILL_AREAS)[number];

export const SKILL_AREA_LABELS: Record<SkillArea, string> = {
  apple: 'Apple',
  windows: 'Windows',
  'google-workspace': 'Google Workspace',
  mdm: 'MDM / JAMF',
  networking: 'Networking',
  ticketing: 'Ticketing',
  'classroom-tech': 'Classroom Technology',
  'hardware-lifecycle': 'Hardware Lifecycle',
  'customer-service': 'Customer Service',
  projects: 'Projects',
  documentation: 'Documentation',
  'incident-response': 'Incident Response',
  'security-awareness': 'Security Awareness',
};

export type ReadinessLevel = 'not-started' | 'learning' | 'developing' | 'job-ready' | 'strong';

export const READINESS_LEVELS: readonly ReadinessLevel[] = [
  'not-started',
  'learning',
  'developing',
  'job-ready',
  'strong',
];
