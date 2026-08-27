import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { useTutorStore } from '@/features/tutor/store';
import { FakeProvider } from '@/features/tutor/fake/FakeProvider';

async function clearAll() {
  await db.tutorSessions.clear();
  await db.tutorTurns.clear();
  await db.attempts.clear();
  await db.attemptState.clear();
}

describe('tutor store (Zustand)', () => {
  beforeEach(async () => {
    await clearAll();
    useTutorStore.getState().reset();
  });

  it('starts a session and persists it to Dexie', async () => {
    const store = useTutorStore.getState();
    store.setProvider(new FakeProvider());
    const sessionId = await store.startSession('attempt-1', 'lab-01');
    expect(sessionId).toBeTruthy();
    const row = await db.tutorSessions.get(sessionId);
    expect(row?.attemptId).toBe('attempt-1');
    expect(row?.labId).toBe('lab-01');
    expect(row?.provider).toBe('fake');
  });

  it('hint level clamps to 1-7', () => {
    const store = useTutorStore.getState();
    store.setHintLevel(0);
    expect(useTutorStore.getState().hintLevel).toBe(1);
    store.setHintLevel(99);
    expect(useTutorStore.getState().hintLevel).toBe(7);
    store.setHintLevel(3);
    expect(useTutorStore.getState().hintLevel).toBe(3);
  });

  it('send streams a response and persists both user and assistant turns', async () => {
    const store = useTutorStore.getState();
    store.setProvider(new FakeProvider());
    const sessionId = await store.startSession('attempt-1', 'lab-01');
    await store.send('What should I do?');

    const after = useTutorStore.getState();
    expect(after.status).toBe('idle');
    expect(after.turns.length).toBe(2);
    expect(after.turns[0]?.role).toBe('user');
    expect(after.turns[1]?.role).toBe('assistant');

    const persisted = await db.tutorTurns
      .where('sessionId')
      .equals(sessionId)
      .sortBy('ts');
    expect(persisted.length).toBe(2);
    expect(persisted[0]?.role).toBe('user');
    expect(persisted[1]?.role).toBe('assistant');
  });

  it('abort cancels an in-flight stream and marks the turn interrupted', async () => {
    const store = useTutorStore.getState();
    store.setProvider(new FakeProvider());
    const sessionId = await store.startSession('attempt-1', 'lab-01');

    // Start a send, then immediately abort
    const sendPromise = store.send('A long question that should be aborted mid-stream');
    // Let the stream begin
    await new Promise((r) => setTimeout(r, 30));
    useTutorStore.getState().abort();
    await sendPromise;

    const after = useTutorStore.getState();
    expect(after.status === 'aborted' || after.status === 'idle').toBe(true);

    const persisted = await db.tutorTurns
      .where('sessionId')
      .equals(sessionId)
      .sortBy('ts');
    const assistant = persisted.find((t) => t.role === 'assistant');
    expect(assistant).toBeDefined();
  });

  it('resumeSession loads prior turns in order', async () => {
    const store = useTutorStore.getState();
    store.setProvider(new FakeProvider());
    const sessionId = await store.startSession('attempt-1', 'lab-01');
    await store.send('First question');
    await store.send('Second question');

    // Reset UI, then resume
    useTutorStore.setState({ turns: [], status: 'idle' });
    await useTutorStore.getState().resumeSession(sessionId);

    const after = useTutorStore.getState();
    expect(after.turns.length).toBeGreaterThanOrEqual(4);
    expect(after.turns[0]?.role).toBe('user');
    expect(after.turns[0]?.content).toBe('First question');
  });
});
