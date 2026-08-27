import { create } from 'zustand';
import { db, type TutorSessionRow, type TutorTurnRow } from '@/lib/db/client';
import type { TutorProvider } from './provider';

/**
 * The tutor store. One store instance per active lab. Tracks:
 *  - the current session id
 *  - the hint level
 *  - the streaming response (so the UI can render incrementally)
 *  - the abort controller (so "Stop" works)
 *  - whether a turn is in flight
 *
 * Persists every chunk boundary to `tutorTurns` so the audit log captures
 * interrupted turns (`interrupted: true`) and full responses.
 */

export type TutorStatus = 'idle' | 'streaming' | 'aborted' | 'error';

interface TutorState {
  sessionId: string | null;
  hintLevel: number;
  status: TutorStatus;
  streaming: string;
  error: string | null;
  provider: TutorProvider | null;
  abortController: AbortController | null;
  /** History of completed turns (oldest first). */
  turns: Array<{ role: 'user' | 'assistant'; content: string; ts: number }>;
  /** Latest user message id, used to track the active assistant turn. */
  activeTurnId: string | null;

  setProvider: (provider: TutorProvider) => void;
  setHintLevel: (n: number) => void;
  startSession: (attemptId: string, labId: string) => Promise<string>;
  resumeSession: (sessionId: string) => Promise<void>;
  send: (userMessage: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

const MAX_HISTORY = 32;

export const useTutorStore = create<TutorState>((set, get) => ({
  sessionId: null,
  hintLevel: 1,
  status: 'idle',
  streaming: '',
  error: null,
  provider: null,
  abortController: null,
  turns: [],
  activeTurnId: null,

  setProvider: (provider) => set({ provider }),
  setHintLevel: (n) => set({ hintLevel: Math.max(1, Math.min(7, Math.floor(n))) }),

  startSession: async (attemptId, labId) => {
    const provider = get().provider;
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const row: TutorSessionRow = {
      id: sessionId,
      attemptId,
      labId,
      model: provider?.name ?? 'fake',
      provider: (provider?.name ?? 'fake') as TutorSessionRow['provider'],
      hintLevel: get().hintLevel,
      startedAt: now,
      lastTurnAt: now,
    };
    await db.tutorSessions.add(row);
    set({ sessionId, status: 'idle', streaming: '', error: null, turns: [], activeTurnId: null });
    return sessionId;
  },

  resumeSession: async (sessionId) => {
    const session = await db.tutorSessions.get(sessionId);
    if (!session) return;
    const turnRows = await db.tutorTurns
      .where('sessionId')
      .equals(sessionId)
      .sortBy('ts');
    const turns: Array<{ role: 'user' | 'assistant'; content: string; ts: number }> = turnRows
      .filter((t) => t.role !== 'system' && !t.interrupted)
      .map((t) => ({
        role: t.role as 'user' | 'assistant',
        content: t.content,
        ts: t.ts,
      }));
    set({
      sessionId,
      hintLevel: session.hintLevel,
      status: 'idle',
      streaming: '',
      error: null,
      turns,
      activeTurnId: null,
    });
  },

  send: async (userMessage) => {
    const { provider, sessionId, hintLevel, turns } = get();
    if (!provider) {
      set({ error: 'No tutor provider configured', status: 'error' });
      return;
    }
    if (!sessionId) {
      set({ error: 'No active session', status: 'error' });
      return;
    }
    if (get().status === 'streaming') return;

    const ac = new AbortController();
    const userTurnId = crypto.randomUUID();
    const assistantTurnId = crypto.randomUUID();
    const now = Date.now();

    // Persist user turn
    const userRow: TutorTurnRow = {
      id: userTurnId,
      sessionId,
      role: 'user',
      content: userMessage,
      hintLevel,
      ts: now,
      interrupted: false,
    };
    await db.tutorTurns.add(userRow);

    // Optimistic UI: append the user message immediately
    const newTurn: { role: 'user' | 'assistant'; content: string; ts: number } = {
      role: 'user',
      content: userMessage,
      ts: now,
    };
    const optimisticTurns: Array<{ role: 'user' | 'assistant'; content: string; ts: number }> = [
      ...turns,
      newTurn,
    ].slice(-MAX_HISTORY);

    set({
      status: 'streaming',
      streaming: '',
      error: null,
      abortController: ac,
      turns: optimisticTurns,
      activeTurnId: assistantTurnId,
    });

    let acc = '';
    try {
      const stream = provider.chat({
        user: userMessage,
        history: optimisticTurns.map((t) => ({ role: t.role, content: t.content })),
        // Context is built by the caller via buildContext() — but for the
        // FakeProvider, context is mostly informational. The full provider
        // integration is wired in Step 8.
        context: {
          labId: '',
          labTitle: '',
          track: '',
          week: 0,
          objectives: [],
          methodology: [],
          currentNodeKind: 'unknown',
          currentNodeTitle: '',
          evidenceTitles: [],
          decisionIds: [],
          keyFacts: [],
        },
        hintLevel,
        signal: ac.signal,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          acc += chunk.content;
          set({ streaming: acc });
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error?.message ?? 'Tutor error');
        } else if (chunk.type === 'done') {
          break;
        }
      }

      // Persist completed assistant turn
      const assistantRow: TutorTurnRow = {
        id: assistantTurnId,
        sessionId,
        role: 'assistant',
        content: acc,
        hintLevel,
        ts: Date.now(),
        interrupted: false,
      };
      await db.tutorTurns.add(assistantRow);
      await db.tutorSessions.update(sessionId, { lastTurnAt: Date.now() });

      set((s) => {
        const assistantTurn: { role: 'user' | 'assistant'; content: string; ts: number } = {
          role: 'assistant',
          content: acc,
          ts: Date.now(),
        };
        return {
          status: 'idle',
          streaming: '',
          turns: [...s.turns, assistantTurn].slice(-MAX_HISTORY),
          activeTurnId: null,
          abortController: null,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const interrupted = message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel');

      // Persist whatever we got, marked interrupted if so
      const assistantRow: TutorTurnRow = {
        id: assistantTurnId,
        sessionId,
        role: 'assistant',
        content: acc,
        hintLevel,
        ts: Date.now(),
        interrupted,
      };
      await db.tutorTurns.add(assistantRow);

      set({
        status: interrupted ? 'aborted' : 'error',
        streaming: '',
        error: interrupted ? null : message,
        activeTurnId: null,
        abortController: null,
      });
    }
  },

  abort: () => {
    const { abortController, provider } = get();
    if (provider) provider.abort();
    if (abortController) abortController.abort();
  },

  reset: () => {
    const { abortController, provider } = get();
    if (provider) provider.abort();
    if (abortController) abortController.abort();
    set({
      sessionId: null,
      status: 'idle',
      streaming: '',
      error: null,
      turns: [],
      activeTurnId: null,
      abortController: null,
    });
  },
}));
