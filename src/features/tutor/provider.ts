/**
 * The tutor provider contract. Every concrete provider (Fake, Ollama, OpenRouter)
 * implements this interface. UI code talks to providers through this contract
 * and never to a specific implementation.
 *
 * Streaming: providers yield tokens incrementally. The UI appends tokens to
 * the active assistant message; the store persists a single turn row per
 * completed response.
 *
 * Cancellation: each call to `chat` returns an `AbortSignal`. Cancelling it
 * tells the provider to stop streaming; the active turn is persisted with
 * `interrupted: true` so the audit log records what happened.
 */

export interface TutorTurn {
  /** The learner's message (or a system prompt for first turn). */
  user: string;
  /** Conversation history, oldest first. Each entry is a complete turn. */
  history: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>;
  /** Pre-built context payload (whitelisted fields only). */
  context: TutorContext;
  /** Hint level 1..7; higher = more direct. */
  hintLevel: number;
  /** Cancellation signal. */
  signal: AbortSignal;
}

export interface TutorContext {
  labId: string;
  labTitle: string;
  track: string;
  week: number;
  objectives: readonly string[];
  methodology: readonly string[];
  currentNodeKind: 'intro' | 'inspect' | 'decide' | 'remediate' | 'document' | 'debrief' | 'unknown';
  currentNodeTitle: string;
  evidenceTitles: readonly string[];
  decisionIds: readonly string[];
  /** Free-form facts that the prompt builder has already sanitized. */
  keyFacts: readonly string[];
}

export interface TutorChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  error?: { kind: 'aborted' | 'network' | 'parse' | 'leak-detected'; message: string };
}

export interface TutorDiagnostics {
  providerName: string;
  model: string;
  reachable: boolean;
  hint?: string;
}

export interface TutorProvider {
  readonly name: 'fake' | 'ollama' | 'openrouter';

  /**
   * Stream tokens for one tutor turn. The provider MUST honour `signal` and
   * emit a chunk of type 'error' with kind 'aborted' when cancellation fires.
   */
  chat(turn: TutorTurn): AsyncIterable<TutorChunk>;

  /** Stop any in-flight streaming. Idempotent. */
  abort(): void;

  /** Health / capability diagnostics for the settings panel. */
  getDiagnostics(): Promise<TutorDiagnostics>;
}
