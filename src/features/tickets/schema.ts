import { z } from 'zod';

/**
 * Ticket Zod schema — mirrors the Dexie `TicketRow` for UI validation.
 * The lab JSON seeds the initial fields; the learner edits the editable subset.
 *
 * Read-only fields (seeded from lab JSON): type, category, priority, impact, urgency,
 *   requester, role, channel, initialDescription
 * Learner-editable fields: description (initialDescription gets overridden with
 *   richer troubleshooting notes), notes, resolution, status
 */

export const TicketType = z.enum(['incident', 'request', 'problem', 'change', 'major-incident']);
export const TicketStatus = z.enum(['new', 'in-progress', 'on-hold', 'resolved', 'closed']);
export const TicketPriority = z.enum(['p1', 'p2', 'p3', 'p4']);
export const TicketImpact = z.enum(['low', 'medium', 'high']);
export const TicketUrgency = z.enum(['low', 'medium', 'high']);

export const TicketSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  labId: z.string(),
  type: TicketType,
  status: TicketStatus,
  priority: TicketPriority,
  impact: TicketImpact,
  urgency: TicketUrgency,
  requester: z.string().min(1),
  role: z.string().min(1),
  channel: z.string().min(1),
  category: z.string().min(1),
  description: z.string(),
  notes: z.string().default(''),
  resolution: z.string().default(''),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const TicketEventKind = z.enum([
  'created',
  'status-changed',
  'notes-updated',
  'resolution-updated',
  'description-updated',
  'assigned',
  'escalated',
  'closed',
]);

export type TicketEventKind = z.infer<typeof TicketEventKind>;
