import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import type { Lab } from '@/data/labs/lab.schema';

export interface CaseStudy {
  attemptId: string;
  labId: string;
  labTitle: string;
  scenario: string;
  kbOpportunity: string;
  score: number | null;
  completedAt: number;
  ticket: {
    type: string;
    category: string;
    priority: string;
    description: string;
    resolution: string;
  } | null;
  evidence: { id: string; title: string; body: string; type: string }[];
  evidenceCount: number;
  ticketCount: number;
}

export function useCaseStudies(profileId: string | null | undefined): {
  caseStudies: CaseStudy[];
  loading: boolean;
} {
  const attempts = useLiveQuery(
    () =>
      profileId
        ? db.attempts.where('profileId').equals(profileId).and((a) => a.status === 'completed').toArray()
        : [],
    [profileId],
  );

  // Fetch related ticket + evidence rows in a single pass. We use useLiveQuery on
  // the related tables so Dexie auto-tracks changes; the result is rebuilt each
  // time any of these tables change for any attempt in the profile.
  const tickets = useLiveQuery(
    () => (profileId ? db.tickets.toArray() : []),
    [profileId],
  );
  const evidence = useLiveQuery(
    () => (profileId ? db.evidence.toArray() : []),
    [profileId],
  );

  if (!attempts || !tickets || !evidence) {
    return { caseStudies: [], loading: true };
  }

  const ticketByAttempt = new Map<string, (typeof tickets)[number]>();
  for (const t of tickets) ticketByAttempt.set(t.attemptId, t);

  const evidenceByAttempt = new Map<string, typeof evidence>();
  for (const e of evidence) {
    const list = evidenceByAttempt.get(e.attemptId);
    if (list) list.push(e);
    else evidenceByAttempt.set(e.attemptId, [e]);
  }

  const caseStudies: CaseStudy[] = [];
  for (const attempt of attempts) {
    const lab = LAB_MANIFEST.find((l) => l.id === attempt.labId);
    if (!lab) continue;
    const ticket = ticketByAttempt.get(attempt.id);
    const ev = evidenceByAttempt.get(attempt.id) ?? [];
    caseStudies.push({
      attemptId: attempt.id,
      labId: attempt.labId,
      labTitle: lab.title,
      scenario: (lab as unknown as Lab).scenario ?? '',
      kbOpportunity: (lab as unknown as Lab).kbOpportunity ?? '',
      score: attempt.score,
      completedAt: attempt.completedAt ?? attempt.startedAt,
      ticket: ticket
        ? {
            type: ticket.type,
            category: ticket.category,
            priority: ticket.priority,
            description: ticket.description,
            resolution: ticket.resolution,
          }
        : null,
      evidence: ev.map((e) => ({ id: e.id, title: e.title, body: e.body, type: e.type })),
      evidenceCount: ev.length,
      ticketCount: ticket ? 1 : 0,
    });
  }

  return { caseStudies, loading: false };
}

export interface PortfolioSummary {
  totalCompleted: number;
  totalEvidence: number;
  totalTickets: number;
  averageScore: number | null;
  topTrack: string | null;
}

export function usePortfolioSummary(profileId: string | null | undefined): PortfolioSummary {
  const attempts = useLiveQuery(
    () =>
      profileId
        ? db.attempts.where('profileId').equals(profileId).and((a) => a.status === 'completed').toArray()
        : [],
    [profileId],
  );
  const tickets = useLiveQuery(
    () => (profileId ? db.tickets.toArray() : []),
    [profileId],
  );
  const evidence = useLiveQuery(
    () => (profileId ? db.evidence.toArray() : []),
    [profileId],
  );

  const completed = attempts ?? [];
  const scores = completed.map((a) => a.score).filter((s): s is number => s !== null);
  const avg = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : null;

  // For summary purposes, totalEvidence and totalTickets are best-effort counts
  // of the rows we already loaded.
  const totalEvidence = evidence?.length ?? 0;
  const totalTickets = tickets?.length ?? 0;

  return {
    totalCompleted: completed.length,
    totalEvidence,
    totalTickets,
    averageScore: avg,
    topTrack: null,
  };
}
