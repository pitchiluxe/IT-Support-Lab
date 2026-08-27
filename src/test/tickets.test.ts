import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { LabSchema } from '@/data/labs/lab.schema';
import { startOrResumeAttempt, dispatch } from '@/features/lab-engine/run';
import {
  getOrCreateTicket,
  updateTicketNotes,
  updateTicketResolution,
  advanceTicketStatus,
  getTicketTimeline,
} from '@/features/tickets/store';
import { TicketSchema } from '@/features/tickets/schema';
import lab01Raw from '@/data/labs/content/lab-01.json';

const lab = LabSchema.parse(lab01Raw);

async function clearAll() {
  await db.attempts.clear();
  await db.attemptState.clear();
  await db.actions.clear();
  await db.decisions.clear();
  await db.evidence.clear();
  await db.hypotheses.clear();
  await db.tickets.clear();
  await db.ticketEvents.clear();
}

describe('tickets (Lab 01 round-trip)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('getOrCreateTicket seeds from the lab ticket', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const ticket = await getOrCreateTicket(attempt.id, lab);
    expect(ticket.type).toBe('incident');
    expect(ticket.priority).toBe('p2');
    expect(ticket.requester).toBe('Mrs. Hayes');
    expect(ticket.role).toBe('Faculty');
    expect(ticket.channel).toBe('phone');
    expect(ticket.category).toContain('Wi-Fi');
    expect(ticket.status).toBe('new');
    expect(ticket.description).toContain('Mrs. Hayes');
  });

  it('a second getOrCreateTicket call returns the same row', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const a = await getOrCreateTicket(attempt.id, lab);
    const b = await getOrCreateTicket(attempt.id, lab);
    expect(b.id).toBe(a.id);
  });

  it('every change appends a ticketEvent', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const ticket = await getOrCreateTicket(attempt.id, lab);
    await updateTicketNotes(ticket.id, 'Saw APIPA IP 169.254.42.18');
    await updateTicketResolution(ticket.id, 'Account was locked; unlocked.');
    await advanceTicketStatus(ticket.id, 'in-progress');
    await advanceTicketStatus(ticket.id, 'resolved');

    const events = await getTicketTimeline(ticket.id);
    const kinds = events.map((e) => e.kind);
    expect(kinds).toEqual([
      'created',
      'notes-updated',
      'resolution-updated',
      'status-changed',
      'status-changed',
    ]);
  });

  it('the ticket validates against the Zod schema', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const ticket = await getOrCreateTicket(attempt.id, lab);
    const result = TicketSchema.safeParse(ticket);
    expect(result.success).toBe(true);
  });

  it('timeline is append-only (newer events never overwrite older)', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const ticket = await getOrCreateTicket(attempt.id, lab);
    await updateTicketNotes(ticket.id, 'Note 1');
    await new Promise((r) => setTimeout(r, 5));
    await updateTicketNotes(ticket.id, 'Note 2');
    await new Promise((r) => setTimeout(r, 5));
    await updateTicketNotes(ticket.id, 'Note 3');

    const events = await getTicketTimeline(ticket.id);
    const noteEvents = events.filter((e) => e.kind === 'notes-updated');
    expect(noteEvents).toHaveLength(3);
    // Reconstruct: the latest notes-updated carries the most recent value
    expect(noteEvents[noteEvents.length - 1]?.payload).toBe('Note 3');
  });

  it('integrates with the FSM: gold path leaves the ticket ready to close', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');
    const ticket = await getOrCreateTicket(attempt.id, lab);

    await dispatch(lab, attempt.id, 'intake-recorded');
    await dispatch(lab, attempt.id, 'evidence-saved', { text: 'Wi-Fi error: EAP auth failed' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-account-locked' });
    await dispatch(lab, attempt.id, 'scope-recorded');
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-second-device' });
    await dispatch(lab, attempt.id, 'hypothesis-saved', { statement: 'Account is locked' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-unlock-account' });
    await dispatch(lab, attempt.id, 'validation-saved');
    await dispatch(lab, attempt.id, 'followup-saved', { message: 'All set' });

    // The ticket is independent of the FSM; it should still hold notes+resolution
    await updateTicketNotes(ticket.id, 'Saw EAP auth error and APIPA IP.');
    await updateTicketResolution(ticket.id, 'Account was locked; unlocked in directory.');
    await advanceTicketStatus(ticket.id, 'in-progress');
    await advanceTicketStatus(ticket.id, 'resolved');

    const final = await db.tickets.get(ticket.id);
    expect(final?.status).toBe('resolved');
    expect(final?.notes).toContain('EAP');
    expect(final?.resolution).toContain('unlocked');

    const events = await getTicketTimeline(ticket.id);
    expect(events.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects a ticket row that violates the schema', () => {
    const result = TicketSchema.safeParse({
      id: 'x',
      attemptId: 'a',
      labId: 'l',
      type: 'invalid-type',
      status: 'new',
      priority: 'p2',
      impact: 'high',
      urgency: 'high',
      requester: 'r',
      role: 'f',
      channel: 'c',
      category: 'c',
      description: 'd',
      notes: '',
      resolution: '',
      createdAt: 0,
      updatedAt: 0,
    });
    expect(result.success).toBe(false);
  });
});
