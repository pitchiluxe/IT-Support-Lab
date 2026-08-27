import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import type { LabDecisionPoint } from '@/data/labs/lab.schema';
import { scoreAttempt, type ScoreResult } from './rubric';
import { TECHNICAL_LABELS, PROFESSIONAL_LABELS } from './areas';
import { TECHNICAL_CATEGORIES, PROFESSIONAL_CATEGORIES } from './areas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, TrendingDown, Award, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Re-score a finished attempt from raw Dexie data. Returns null while
 * any of the required tables are still loading. The component that uses
 * this should render a loading skeleton when null.
 */
export function useDebriefScore(attemptId: string): ScoreResult | null {
  const attempt = useLiveQuery(() => db.attempts.get(attemptId), [attemptId]);
  const lab = useLiveQuery(
    () => (attempt ? db.labs.get(attempt.labId) : undefined),
    [attempt?.labId],
  );
  const decisions = useLiveQuery(
    () => db.decisions.where('attemptId').equals(attemptId).toArray(),
    [attemptId],
  );
  const evidence = useLiveQuery(
    () => db.evidence.where('attemptId').equals(attemptId).toArray(),
    [attemptId],
  );
  const actions = useLiveQuery(
    () => db.actions.where('attemptId').equals(attemptId).toArray(),
    [attemptId],
  );
  const state = useLiveQuery(() => db.attemptState.get(attemptId), [attemptId]);
  const ticket = useLiveQuery(
    () => db.tickets.where('attemptId').equals(attemptId).first(),
    [attemptId],
  );

  if (!attempt || !lab || !decisions || !evidence || !actions || !state || !ticket) {
    return null;
  }
  if (!attempt.completedAt) return null;

  const lab_ = lab as unknown as Parameters<typeof scoreAttempt>[0]['lab'];
  return scoreAttempt({
    lab: lab_,
    decisions: decisions.map((d) => ({
      decisionPointId: d.decisionPointId,
      choice: d.choice,
      ts: d.ts,
    })),
    evidence: evidence.map((e) => ({
      id: e.id,
      title: e.title,
      body: e.body,
      type: e.type,
    })),
    actions: actions.map((a) => ({ kind: a.kind })),
    terminalNodeId: state.node ?? null,
    remediated:
      actions.some((a) => a.kind === 'remediate') ||
      evidence.some((e) => e.type === 'command-output'),
    notes: ticket.notes ?? '',
    resolution: ticket.resolution ?? '',
  });
}

interface DebriefScreenProps {
  attemptId: string;
  labId: string;
  labTitle: string;
  nextLabId?: string;
  nextLabTitle?: string;
}

export function DebriefScreen({
  attemptId,
  labId,
  labTitle,
  nextLabId,
  nextLabTitle,
}: DebriefScreenProps) {
  const navigate = useNavigate();
  const score = useDebriefScore(attemptId);

  const decisions = useLiveQuery(
    () => db.decisions.where('attemptId').equals(attemptId).sortBy('ts'),
    [attemptId],
  );

  const decisionsById = useLiveQuery(
    async () => {
      const lab = await db.labs.get(labId);
      if (!lab) return new Map<string, LabDecisionPoint>();
      const m = new Map<string, LabDecisionPoint>();
      const lab_ = lab as unknown as import('@/data/labs/lab.schema').Lab;
      for (const dp of lab_.decisionPoints) {
        m.set(dp.id, dp);
      }
      return m;
    },
    [labId],
  );

  if (score === null) {
    return <DebriefSkeleton />;
  }

  const techData = TECHNICAL_CATEGORIES.map((k) => ({
    name: TECHNICAL_LABELS[k],
    value: score.technical[k],
    pct: Math.round((score.technical[k] / 2) * 100),
  }));

  const profData = PROFESSIONAL_CATEGORIES.map((k) => ({
    name: PROFESSIONAL_LABELS[k],
    value: score.professional[k],
    pct: Math.round((score.professional[k] / 2) * 100),
  }));

  const overall = Math.round((score.technicalPct + score.professionalPct) / 2);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Lab Complete: {labTitle}</h1>
        <p className="text-muted-foreground">
          Overall score: <strong className="text-foreground">{overall}%</strong>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="outline">Technical {score.technicalPct}%</Badge>
        <Badge variant="outline">Professional {score.professionalPct}%</Badge>
        <Badge variant="outline">Decisions: {decisions?.length ?? 0}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Technical Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreBars data={techData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Professional Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreBars data={profData} />
        </CardContent>
      </Card>

      {score.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {score.strengths.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>{s.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {s.value.toFixed(1)} / 2
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {score.weaknesses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Areas to Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {score.weaknesses.map((w) => (
                <li key={w.key} className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span>{w.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {w.value.toFixed(1)} / 2
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {decisions && decisionsById && decisions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Your Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {decisions.map((d, i) => {
                const dp = decisionsById.get(d.decisionPointId);
                const chosen = dp?.options.find((o) => o.id === d.choice);
                const bestOpt = dp?.options.reduce<LabDecisionPoint['options'][number] | null>(
                  (best, o) => {
                    if (!best) return o;
                    const a = best.score.diagnosis + best.score.evidence + best.score.resolution;
                    const b = o.score.diagnosis + o.score.evidence + o.score.resolution;
                    return b > a ? o : best;
                  },
                  null,
                );
                const isCorrect = chosen && bestOpt && chosen.id === bestOpt.id;
                return (
                  <li key={d.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{chosen?.label ?? d.choice}</p>
                      {dp && (
                        <p className="text-xs text-muted-foreground">
                          {dp.prompt.slice(0, 80)}…
                        </p>
                      )}
                    </div>
                    {isCorrect !== undefined && (
                      <Badge
                        variant={isCorrect ? 'default' : 'destructive'}
                        className="shrink-0 text-xs"
                      >
                        {isCorrect ? 'Correct' : 'Suboptimal'}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        {nextLabId ? (
          <Button onClick={() => navigate(`/lab/${nextLabId}`)}>
            Next: {nextLabTitle ?? nextLabId}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <Award className="h-8 w-8" />
            <p>Lab 02 not yet available. More labs are coming soon.</p>
            <Button variant="outline" onClick={() => navigate('/labs')}>
              Back to Labs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DebriefSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

interface BarDatum {
  name: string;
  value: number;
  pct: number;
}

function ScoreBars({ data }: { data: BarDatum[] }) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{d.name}</span>
            <span className="text-muted-foreground">{d.pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${d.pct}%`,
                backgroundColor: barColor(d.pct),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function barColor(pct: number): string {
  if (pct >= 75) return 'hsl(142 76% 36%)';
  if (pct >= 50) return 'hsl(48 96% 53%)';
  return 'hsl(0 84% 60%)';
}
