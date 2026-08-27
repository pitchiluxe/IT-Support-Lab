import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { startOrResumeAttempt, dispatch, resetAttemptToStart } from '@/features/lab-engine/run';
import { LabSchema } from '@/data/labs/lab.schema';
import lab01Raw from '@/data/labs/content/lab-01.json';

const lab = LabSchema.parse(lab01Raw);

async function clearAll() {
  await db.attempts.clear();
  await db.attemptState.clear();
  await db.actions.clear();
  await db.decisions.clear();
  await db.evidence.clear();
  await db.hypotheses.clear();
}

describe('run.ts (Lab 01 walk-through)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('gold path completes and reaches terminal', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');

    await dispatch(lab, attempt.id, 'intake-recorded');
    await dispatch(lab, attempt.id, 'evidence-saved', { text: 'Wi-Fi error: EAP auth failed' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-account-locked' });
    await dispatch(lab, attempt.id, 'scope-recorded');
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-second-device' });
    await dispatch(lab, attempt.id, 'hypothesis-saved', { statement: 'Account is locked' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-unlock-account' });
    await dispatch(lab, attempt.id, 'validation-saved');
    await dispatch(lab, attempt.id, 'followup-saved', { message: 'All set' });

    const state = await db.attemptState.get(attempt.id);
    expect(state?.node).toBe('debrief');
    const finalAttempt = await db.attempts.get(attempt.id);
    expect(finalAttempt?.status).toBe('completed');
  });

  it('error path records different choices', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');

    await dispatch(lab, attempt.id, 'intake-recorded');
    await dispatch(lab, attempt.id, 'evidence-saved', { text: 'No info' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-ap-outage' });
    await dispatch(lab, attempt.id, 'scope-recorded');
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-reset-pwd' });
    await dispatch(lab, attempt.id, 'hypothesis-saved', { statement: 'Unsure' });
    await dispatch(lab, attempt.id, 'decision-made', { optionId: 'opt-rebuild-laptop' });
    await dispatch(lab, attempt.id, 'validation-saved');
    await dispatch(lab, attempt.id, 'followup-saved', { message: 'Done' });

    const decisions = await db.decisions
      .where('attemptId')
      .equals(attempt.id)
      .sortBy('ts');
    expect(decisions).toHaveLength(3);
    expect(decisions[0]?.choice).toBe('opt-ap-outage');
    expect(decisions[1]?.choice).toBe('opt-reset-pwd');
    expect(decisions[2]?.choice).toBe('opt-rebuild-laptop');
  });

  it('every dispatch writes an action row (audit log)', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');

    await dispatch(lab, attempt.id, 'intake-recorded');
    await dispatch(lab, attempt.id, 'evidence-saved');
    await dispatch(lab, attempt.id, 'decision-made');

    const actions = await db.actions
      .where('attemptId')
      .equals(attempt.id)
      .sortBy('seq');
    expect(actions).toHaveLength(3);
    expect(actions[0]?.kind).toBe('intake-recorded');
    expect(actions[1]?.kind).toBe('evidence-saved');
    expect(actions[2]?.kind).toBe('decision-made');
  });

  it('unknown events do not change state and still log the attempt', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');

    const result = await dispatch(lab, attempt.id, 'nonexistent-event');
    expect(result.changed).toBe(false);

    const state = await db.attemptState.get(attempt.id);
    expect(state?.node).toBe('intake');
  });

  it('resetAttemptToStart clears history and resets node when state is stale', async () => {
    const { attempt } = await startOrResumeAttempt(lab, 'profile-1');

    // Simulate a stale IndexedDB state: hand-write a state row with a node
    // id that does not exist in the lab (e.g. from a previous version).
    const now = Date.now();
    await db.attemptState.put({
      id: attempt.id,
      attemptId: attempt.id,
      labId: lab.id,
      node: 'node-that-does-not-exist',
      history: [{ node: 'some-old-node', event: 'old-event', ts: now - 1000 }],
      variables: { 'old-event': 'stale' },
      updatedAt: now,
    });
    await db.attempts.update(attempt.id, { status: 'completed', completedAt: now });

    // The reset should snap back to the lab's startNode with empty history
    // and variables, but keep the same attemptId so the audit log stays
    // linked. The attempt is re-opened (status: in-progress).
    const fresh = await resetAttemptToStart(lab, attempt.id);
    expect(fresh.node).toBe(lab.startNode);
    expect(fresh.history).toEqual([]);
    expect(fresh.variables).toEqual({});

    const persisted = await db.attemptState.get(attempt.id);
    expect(persisted?.node).toBe(lab.startNode);

    const attemptAfter = await db.attempts.get(attempt.id);
    expect(attemptAfter?.status).toBe('in-progress');
    expect(attemptAfter?.completedAt).toBeNull();

    // After reset, the FSM can dispatch normally.
    const result = await dispatch(lab, attempt.id, 'intake-recorded');
    expect(result.changed).toBe(true);
  });
});
