import Dexie, { type Table } from 'dexie';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The Dexie/IndexedDB client. Tables are defined in schema.ts; this file
 * is the only place that constructs the singleton instance.
 *
 * Source-of-truth rule: Dexie is the persistence layer; UI state lives in
 * Zustand. The two talk via `useLiveQuery` from dexie-react-hooks.
 */
export interface ProfileRow {
  id: string;
  name: string;
  schedule: '6' | '8' | '12' | '16';
  createdAt: number;
}

export interface AttemptRow {
  id: string;
  profileId: string;
  labId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  startedAt: number;
  completedAt: number | null;
  score: number | null;
}

export interface AttemptStateRow {
  id: string;
  attemptId: string;
  labId: string;
  node: string;
  history: { node: string; event: string; ts: number }[];
  variables: Record<string, unknown>;
  updatedAt: number;
}

export interface TicketRow {
  id: string;
  attemptId: string;
  labId: string;
  type: 'incident' | 'request' | 'problem' | 'change' | 'major-incident';
  status: 'new' | 'in-progress' | 'on-hold' | 'resolved' | 'closed';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  requester: string;
  role: string;
  channel: string;
  category: string;
  description: string;
  notes: string;
  resolution: string;
  createdAt: number;
  updatedAt: number;
}

export interface TicketEventRow {
  id: string;
  ticketId: string;
  ts: number;
  kind: string;
  actor: 'learner' | 'system' | 'tutor';
  payload: string;
}

export interface ActionRow {
  id: string;
  attemptId: string;
  labId: string;
  kind: string;
  payload: string;
  ts: number;
  seq: number;
}

export interface DecisionRow {
  id: string;
  attemptId: string;
  labId: string;
  decisionPointId: string;
  choice: string;
  ts: number;
}

export interface EvidenceRow {
  id: string;
  attemptId: string;
  labId: string;
  type: 'note' | 'screenshot' | 'log' | 'config' | 'command-output';
  title: string;
  body: string;
  createdAt: number;
}

export interface HypothesisRow {
  id: string;
  attemptId: string;
  labId: string;
  statement: string;
  ts: number;
}

export interface ScoreRow {
  id: string;
  attemptId: string;
  labId: string;
  technical: Record<string, number>;
  professional: Record<string, number>;
  ts: number;
}

export interface TutorSessionRow {
  id: string;
  attemptId: string;
  labId: string;
  model: string;
  provider: 'ollama' | 'openrouter' | 'fake';
  hintLevel: number;
  startedAt: number;
  lastTurnAt: number;
}

export interface TutorTurnRow {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hintLevel: number;
  ts: number;
  interrupted: boolean;
}

export interface TutorActionRow {
  id: string;
  sessionId: string;
  turnId: string;
  suggested: string;
  learnerTook: boolean | null;
  ts: number;
}

export interface AppEventRow {
  id?: number;
  kind: string;
  payload: string;
  ts: number;
}

export interface ErrorRow {
  id?: number;
  kind: string;
  message: string;
  stack: string | null;
  ts: number;
}

export interface SchemaVersionRow {
  key: string;
  version: number;
  migratedAt: number;
}

export interface SettingsRow {
  key: string;
  value: string;
}

export interface StudyPlanRow {
  id: string;
  profileId: string;
  weeks: number;
  createdAt: number;
}

export interface ReadinessRow {
  id: string;
  profileId: string;
  area: string;
  level: 'not-started' | 'learning' | 'developing' | 'job-ready' | 'strong';
  evidenceCount: number;
  updatedAt: number;
}

export interface ArtifactRow {
  id: string;
  profileId: string;
  kind: string;
  title: string;
  payload: string;
  createdAt: number;
}

export interface KbArticleRow {
  id: string;
  slug: string;
  title: string;
  body: string;
  authorAttemptId: string;
  createdAt: number;
  updatedAt: number;
}

class AppDatabase extends Dexie {
  // Declared here as types only; actual column lists are configured in schema.ts
  declare profiles: Table<ProfileRow, string>;
  declare settings: Table<SettingsRow, string>;
  declare labs: Table<Lab, string>;
  declare studyPlans: Table<StudyPlanRow, string>;
  declare attempts: Table<AttemptRow, string>;
  declare attemptState: Table<AttemptStateRow, string>;
  declare evidence: Table<EvidenceRow, string>;
  declare decisions: Table<DecisionRow, string>;
  declare hypotheses: Table<HypothesisRow, string>;
  declare actions: Table<ActionRow, string>;
  declare tickets: Table<TicketRow, string>;
  declare ticketEvents: Table<TicketEventRow, string>;
  declare tutorSessions: Table<TutorSessionRow, string>;
  declare tutorTurns: Table<TutorTurnRow, string>;
  declare tutorActions: Table<TutorActionRow, string>;
  declare scores: Table<ScoreRow, string>;
  declare readiness: Table<ReadinessRow, string>;
  declare artifacts: Table<ArtifactRow, string>;
  declare kbArticles: Table<KbArticleRow, string>;
  declare appEvents: Table<AppEventRow, number>;
  declare errors: Table<ErrorRow, number>;
  declare schemaVersion: Table<SchemaVersionRow, string>;

  constructor() {
    super('itsla');
    this.version(1).stores({
      profiles: 'id, createdAt',
      settings: 'key',
      labs: 'id, week, track, order',
      studyPlans: 'id, profileId, createdAt',
      attempts: 'id, profileId, labId, status, startedAt',
      attemptState: 'id, attemptId, labId, updatedAt',
      evidence: 'id, attemptId, labId, type, createdAt',
      decisions: 'id, attemptId, labId, decisionPointId, ts',
      hypotheses: 'id, attemptId, labId, ts',
      actions: 'id, attemptId, labId, kind, ts, seq',
      tickets: 'id, attemptId, labId, type, status, priority, createdAt',
      ticketEvents: 'id, ticketId, ts',
      tutorSessions: 'id, attemptId, labId, startedAt',
      tutorTurns: 'id, sessionId, ts',
      tutorActions: 'id, sessionId, turnId, ts',
      scores: 'id, attemptId, labId, ts',
      readiness: 'id, profileId, area, updatedAt',
      artifacts: 'id, profileId, kind, createdAt',
      kbArticles: 'id, slug, authorAttemptId, updatedAt',
      appEvents: '++id, kind, ts',
      errors: '++id, kind, ts',
      schemaVersion: 'key',
    });
  }
}

export const db = new AppDatabase();
