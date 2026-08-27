import { db, type TicketRow } from '@/lib/db/client';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * Create a ticket row from a lab's ticket seed. Called once when the learner
 * enters the lab for the first time (intake node). Returns the existing ticket
 * if one is already open for this attempt.
 */
export async function getOrCreateTicket(
  attemptId: string,
  lab: Lab,
): Promise<TicketRow> {
  const existing = await db.tickets
    .where('attemptId')
    .equals(attemptId)
    .first();

  if (existing) return existing;

  const now = Date.now();
  const ticket: TicketRow = {
    id: crypto.randomUUID(),
    attemptId,
    labId: lab.id,
    type: lab.ticket.type,
    status: 'new',
    priority: lab.ticket.priority as TicketRow['priority'],
    impact: lab.ticket.impact as TicketRow['impact'],
    urgency: lab.ticket.urgency as TicketRow['urgency'],
    requester: lab.ticket.requester.name,
    role: lab.ticket.requester.role,
    channel: lab.channel,
    category: lab.ticket.category,
    description: lab.ticket.initialDescription,
    notes: '',
    resolution: '',
    createdAt: now,
    updatedAt: now,
  };

  await db.tickets.add(ticket);
  await appendTicketEvent(ticket.id, 'created', ticket.description, 'system');

  return ticket;
}

/** Update editable ticket fields and append a ticket event. */
export async function updateTicketNotes(
  ticketId: string,
  notes: string,
): Promise<void> {
  const ts = Date.now();
  await db.tickets.update(ticketId, { notes, updatedAt: ts });
  await appendTicketEvent(ticketId, 'notes-updated', notes, 'learner');
}

export async function updateTicketResolution(
  ticketId: string,
  resolution: string,
): Promise<void> {
  const ts = Date.now();
  await db.tickets.update(ticketId, { resolution, updatedAt: ts });
  await appendTicketEvent(ticketId, 'resolution-updated', resolution, 'learner');
}

export async function updateTicketDescription(
  ticketId: string,
  description: string,
): Promise<void> {
  const ts = Date.now();
  await db.tickets.update(ticketId, { description, updatedAt: ts });
  await appendTicketEvent(ticketId, 'description-updated', description, 'learner');
}

export async function advanceTicketStatus(
  ticketId: string,
  status: TicketRow['status'],
): Promise<void> {
  const ts = Date.now();
  await db.tickets.update(ticketId, { status, updatedAt: ts });
  await appendTicketEvent(ticketId, 'status-changed', status, 'system');
}

/** Append one event to the ticket timeline. */
async function appendTicketEvent(
  ticketId: string,
  kind: string,
  payload: string,
  actor: 'learner' | 'system' | 'tutor',
): Promise<void> {
  await db.ticketEvents.add({
    id: crypto.randomUUID(),
    ticketId,
    ts: Date.now(),
    kind,
    payload,
    actor,
  });
}

/**
 * Reconstruct the ticket timeline from `ticketEvents`. The timeline is
 * append-only — the latest event always represents the current state.
 */
export async function getTicketTimeline(
  ticketId: string,
): Promise<Array<{ id: string; ts: number; kind: string; actor: string; payload: string }>> {
  const events = await db.ticketEvents
    .where('ticketId')
    .equals(ticketId)
    .sortBy('ts');
  return events;
}
