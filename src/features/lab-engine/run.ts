import type { Lab } from '@/data/labs/lab.schema';
import { db, type ActionRow, type AttemptRow, type AttemptStateRow } from '@/lib/db/client';
import { initialState, transition, isTerminal, type FsmState } from './fsm';
void initialState; // re-exported for future use

/**
 * Lab engine: pure FSM + Dexie persistence. This is the only module that
 * writes to attemptState, decisions, evidence, hypotheses, and actions
 * for a given attempt.
 *
 * The audit log (`actions` table) records every dispatch. Replay from the
 * log reproduces the same final state.
 */

export interface StartLabResult {
  attempt: AttemptRow;
  state: AttemptStateRow;
}

/** Start (or resume) a lab attempt. */
export async function startOrResumeAttempt(
  lab: Lab,
  profileId: string,
): Promise<StartLabResult> {
  const existing = await db.attempts
    .where('profileId')
    .equals(profileId)
    .filter((a) => a.labId === lab.id && (a.status === 'in-progress' || a.status === 'not-started'))
    .first();

  if (existing) {
    const stateRow = await db.attemptState.get(existing.id);
    if (stateRow) {
      // If the state row is missing, recreate it from initial state
      return { attempt: existing, state: stateRow };
    }
    const fresh: AttemptStateRow = {
      id: existing.id,
      attemptId: existing.id,
      labId: existing.id,
      node: lab.startNode,
      history: [],
      variables: {},
      updatedAt: Date.now(),
    };
    await db.attemptState.add(fresh);
    return { attempt: existing, state: fresh };
  }

  const attemptId = crypto.randomUUID();
  const now = Date.now();
  const attempt: AttemptRow = {
    id: attemptId,
    profileId,
    labId: lab.id,
    status: 'in-progress',
    startedAt: now,
    completedAt: null,
    score: null,
  };
  const stateRow: AttemptStateRow = {
    id: attemptId,
    attemptId,
    labId: lab.id,
    node: lab.startNode,
    history: [],
    variables: {},
    updatedAt: now,
  };
  await db.attempts.add(attempt);
  await db.attemptState.add(stateRow);
  return { attempt, state: stateRow };
}

/**
 * Reset an in-progress attempt back to the lab's startNode. Used when the
 * persisted state references a node id that no longer exists in the lab
 * (e.g. content was edited between sessions, or the seeded lab was replaced
 * by a newer version). Keeps the same attemptId so the actions audit log
 * stays linked, and clears history/variables so the learner starts clean.
 */
export async function resetAttemptToStart(
  lab: Lab,
  attemptId: string,
): Promise<AttemptStateRow> {
  const now = Date.now();
  const fresh: AttemptStateRow = {
    id: attemptId,
    attemptId,
    labId: lab.id,
    node: lab.startNode,
    history: [],
    variables: {},
    updatedAt: now,
  };
  await db.attemptState.put(fresh);
  await db.attempts.update(attemptId, { status: 'in-progress', completedAt: null });
  return fresh;
}

/** Monotonic counter for sequencing audit log entries within the same ms. */
let _seq = 0;
function nextSeq() { return ++_seq; }

/** Dispatch an event for an in-progress attempt. Persists state + audit log. */
export async function dispatch(
  lab: Lab,
  attemptId: string,
  event: string,
  payload?: unknown,
): Promise<{ changed: boolean; reason?: string; state: AttemptStateRow }> {
  const stateRow = await db.attemptState.get(attemptId);
  if (!stateRow) throw new Error(`Attempt state not found: ${attemptId}`);

  const fsmState: FsmState = { node: stateRow.node, variables: stateRow.variables };
  const result = transition(lab, fsmState, { event, payload });

  // Use sub-ms sequence to guarantee ordering within the same timestamp
  const ts = Date.now();
  const seq = nextSeq();
  const actionRow: ActionRow = {
    id: crypto.randomUUID(),
    attemptId,
    labId: lab.id,
    kind: event,
    payload: payload === undefined ? '' : JSON.stringify(payload),
    ts,
    seq,
  };
  await db.actions.add(actionRow);

  // Auto-record decisions when payload carries optionId
  if (event === 'decision-made' && typeof payload === 'object' && payload !== null && 'optionId' in payload) {
    const p = payload as { optionId: string };
    const node = lab.nodes.find((n) => n.id === stateRow.node);
    const decisionPointId = node?.kind === 'decide' ? (node as { decisionPointId?: string }).decisionPointId ?? 'unknown' : 'unknown';
    await db.decisions.add({
      id: crypto.randomUUID(),
      attemptId,
      labId: lab.id,
      decisionPointId,
      choice: p.optionId,
      ts,
    });
  }

  if (!result.changed) {
    return result.reason
      ? { changed: false, reason: result.reason, state: stateRow }
      : { changed: false, state: stateRow };
  }

  const updated: AttemptStateRow = {
    ...stateRow,
    node: result.state.node,
    variables: { ...stateRow.variables, ...result.state.variables },
    history: [...stateRow.history, { node: result.state.node, event, ts }],
    updatedAt: ts,
  };
  await db.attemptState.put(updated);

  if (isTerminal(lab, result.state)) {
    await db.attempts.update(attemptId, { status: 'completed', completedAt: ts });
  }

  return { changed: true, state: updated };
}

/** Record a decision (called when the learner picks a decision-point option). */
export async function recordDecision(
  attemptId: string,
  labId: string,
  decisionPointId: string,
  choice: string,
): Promise<void> {
  await db.decisions.add({
    id: crypto.randomUUID(),
    attemptId,
    labId,
    decisionPointId,
    choice,
    ts: Date.now(),
  });
}

/** Record a hypothesis statement. Used by the gating UI and tutor prompt. */
export async function recordHypothesis(
  attemptId: string,
  labId: string,
  statement: string,
): Promise<void> {
  await db.hypotheses.add({
    id: crypto.randomUUID(),
    attemptId,
    labId,
    statement,
    ts: Date.now(),
  });
}

/** Record an evidence item. */
export async function recordEvidence(
  attemptId: string,
  labId: string,
  type: 'note' | 'screenshot' | 'log' | 'config' | 'command-output',
  title: string,
  body: string,
): Promise<void> {
  await db.evidence.add({
    id: crypto.randomUUID(),
    attemptId,
    labId,
    type,
    title,
    body,
    createdAt: Date.now(),
  });
}
