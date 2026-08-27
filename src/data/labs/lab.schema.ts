import { z } from 'zod';

/**
 * Lab content schema. Defines the 22 spec fields plus the spine needed by the
 * lab engine. This is the canonical contract every lab JSON must satisfy.
 *
 * Hardening notes:
 *  - String lengths are bounded to prevent absurd payloads.
 *  - `expected*`, `correct*`, `solution*` fields are intentionally absent from
 *    anything that could be serialized into a tutor prompt. The prompt builder
 *    in src/features/tutor/prompt.ts MUST use the whitelist, not the raw lab.
 */

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'id must be kebab-case, ≤64 chars');

const SlaWindow = z.enum(['business-hours', '24x7', 'next-day', 'week']);

const FsmEvent = z.object({
  event: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  requires: z.array(z.string()).optional(),
  effect: z.string().optional(),
});

const FsmNode = z.object({
  // Unique slug id used for transitions and terminalNodes.
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'node id must be lowercase slug'),
  // Description of what the learner sees at this node. Used by RunLab to pick a renderer.
  kind: z.enum(['intro', 'inspect', 'decide', 'remediate', 'document', 'debrief']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  // For decide nodes
  decisionPointId: z.string().optional(),
  // For inspect / remediate
  locationId: z.string().optional(),
  objectId: z.string().optional(),
  // For document
  prompt: z.string().optional(),
  // Empty for terminal nodes; required (>=1) for non-terminal nodes.
  // Validation: terminal nodes are checked against lab.terminalNodes at the lab level.
  transitions: z.array(FsmEvent).default([]),
});

const ScoringRubric = z.object({
  weights: z.object({
    diagnosis: z.number().min(0).max(2).default(1),
    evidence: z.number().min(0).max(2).default(1),
    troubleshooting: z.number().min(0).max(2).default(1),
    resolution: z.number().min(0).max(2).default(1),
    validation: z.number().min(0).max(2).default(1),
  }),
  thresholds: z.object({
    jobReady: z.number().min(1).default(3),
  }),
});

const EvidenceRequirement = z.object({
  id: z.string(),
  description: z.string().min(1).max(280),
  kind: z.enum(['note', 'screenshot', 'log', 'config', 'command-output']),
});

const DecisionPoint = z.object({
  id: z.string(),
  prompt: z.string().min(1).max(500),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(120),
        // Internal scoring tags; never shown to learner; not used in tutor prompt.
        score: z.object({
          diagnosis: z.number().min(-1).max(1),
          evidence: z.number().min(-1).max(1),
          resolution: z.number().min(-1).max(1),
        }),
        feedback: z.string().min(1).max(280),
      }),
    )
    .min(2)
    .max(5),
});

const PersonFixture = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(80),
  // Free-form extra identifiers. Caller must scrub to avoid real-looking PII.
  // Each value should be a short synthetic token (e.g. "ext. 4521", "rm. 12B", "facility A").
  // We block obvious PII shapes: anything that looks like a real email, phone, or street address.
  identifiers: z
    .record(
      z
        .string()
        .max(40)
        .refine((s) => !/@/.test(s), 'identifier must not look like an email')
        .refine(
          (s) => !/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(s),
          'identifier must not look like a real phone number',
        )
        .refine(
          (s) => !/\b(apt|suite|street|st\.|ave|avenue|blvd|road|rd\.)\b/i.test(s),
          'identifier must not look like a real address',
        ),
    )
    .optional(),
});

const TicketSeed = z.object({
  id: z.string().optional(),
  type: z.enum(['incident', 'request', 'problem', 'change', 'major-incident']),
  category: z.string().min(1).max(80),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']),
  impact: z.enum(['low', 'medium', 'high']),
  urgency: z.enum(['low', 'medium', 'high']),
  sla: SlaWindow,
  initialDescription: z.string().min(1).max(1000),
  requester: PersonFixture,
});

const LocationSeed = z.object({
  id: Id,
  name: z.string().min(1).max(80),
  // Each lab's location is a 2D panel for MVP. 3D is wired but feature-flagged off.
  objects: z
    .array(
      z.object({
        id: Id,
        name: z.string().min(1).max(80),
        // Deterministic state seed → fake but reproducible inspections
        state: z.record(z.unknown()),
      }),
    )
    .min(1),
});

const Methodology = z.enum([
  'identify',
  'scope',
  'reproduce',
  'gather-evidence',
  'hypothesize',
  'test',
  'change',
  'validate',
  'document',
  'follow-up',
]);

export const LabSchema = z.object({
  id: Id,
  schemaVersion: z.literal(1),
  contentVersion: z.number().int().min(1),
  week: z.number().int().min(1).max(52),
  order: z.number().int().min(1),
  // startNode and terminalNodes reference node.id values (slugs).
  startNode: z.string(),
  terminalNodes: z.array(z.string()).min(1),
  track: z.enum([
    'service-desk',
    'windows',
    'apple',
    'google-workspace',
    'mdm',
    'network',
    'classroom-tech',
    'asset',
    'projects',
    'documentation',
    'incident-response',
    'operations',
    'capstone',
  ]),
  title: z.string().min(1).max(200),
  persona: z.string().min(1).max(80),
  channel: z.enum(['phone', 'email', 'in-person', 'video', 'portal']),
  scenario: z.string().min(1).max(2000),
  impact: z.string().min(1).max(1000),
  objectives: z.array(z.string().min(1).max(200)).min(1).max(10),
  tools: z.array(z.string().min(1).max(80)).min(1).max(20),
  evidence: z.array(EvidenceRequirement).min(1).max(10),
  decisionPoints: z.array(DecisionPoint).min(1).max(10),
  ticket: TicketSeed,
  location: LocationSeed,
  nodes: z.array(FsmNode).min(2).max(30),
  scoring: ScoringRubric,
  // Sequence the learner should walk through the methodology; used by tutor prompt.
  methodology: z.array(Methodology).min(3),
  // Free-form KB opportunity text; surfaces in debrief, not in tutor prompt.
  kbOpportunity: z.string().min(1).max(500),
  // Skill areas this lab exercises; intersection with skills/areas.ts.
  skills: z.array(z.string().min(1).max(40)).min(1).max(13),
});

export type Lab = z.infer<typeof LabSchema>;
export type LabFsmNode = z.infer<typeof FsmNode>;
export type LabDecisionPoint = z.infer<typeof DecisionPoint>;
export type LabEvidenceRequirement = z.infer<typeof EvidenceRequirement>;
