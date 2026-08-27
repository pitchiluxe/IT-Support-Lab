import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useProfileStore } from '@/features/profile/store';
import { startOrResumeAttempt, dispatch, recordDecision, recordEvidence, recordHypothesis, resetAttemptToStart } from './run';
import { isTerminal, availableEvents, getNode, type FsmState } from './fsm';
import type { Lab, LabFsmNode } from '@/data/labs/lab.schema';
import { cn } from '@/lib/utils';
import { LabLocationPanel } from '@/features/locations/LabLocationPanel';
import { ThreeCanvasGate } from '@/features/locations/ThreeCanvasGate';

export function RunLab({ labId }: { labId: string }) {
  const { profileId } = useProfileStore();
  const lab = useLiveQuery(() => db.labs.get(labId), [labId]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lab || !profileId) return;
    startOrResumeAttempt(lab as Lab, profileId)
      .then(({ attempt }) => setAttemptId(attempt.id))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [lab, profileId]);

  // Include labId in deps so stateRow is re-queried whenever the lab changes.
  // Without it, a stale stateRow from a previous lab would be used for one
  // render frame after the lab prop updates, causing getNode() to throw.
  const stateRow = useLiveQuery(
    () => (attemptId ? db.attemptState.get(attemptId) : undefined),
    [attemptId, labId],
  );

  // Self-heal: if the persisted state references a node id that no longer
  // exists in the lab (e.g. a stale IndexedDB entry from a previous version
  // of the lab content, or a race when switching labs), reset the attempt
  // back to the lab's startNode. The attemptId is preserved so the actions
  // audit log stays linked.
  useEffect(() => {
    if (!lab || !attemptId || !stateRow) return;
    const typed = lab as Lab;
    const nodeExists = typed.nodes.some((n) => n.id === stateRow.node);
    if (!nodeExists) {
      void resetAttemptToStart(typed, attemptId).catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
    }
  }, [lab, attemptId, stateRow]);

  if (!lab) return <div className="p-6 text-muted-foreground">Loading lab…</div>;
  if (!profileId) return <div className="p-6 text-muted-foreground">Create a profile to begin.</div>;
  if (error) return <div className="p-6 text-destructive">Error: {error}</div>;
  if (!attemptId || !stateRow) return <div className="p-6 text-muted-foreground">Initializing…</div>;

  // Final guard: if self-heal hasn't completed yet (the next render will
  // re-query and pick up the reset state), don't crash — show a brief
  // recovery message instead of calling getNode() with a bad id.
  if (!(lab as Lab).nodes.some((n) => n.id === stateRow.node)) {
    return <div className="p-6 text-muted-foreground">Resetting stale attempt…</div>;
  }

  const fsmState: FsmState = { node: stateRow.node, variables: stateRow.variables };
  const node = getNode(lab as Lab, stateRow.node);
  const terminal = isTerminal(lab as Lab, fsmState);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Ambient 3D campus layer — only visible when the learner has 3D mode on. */}
      <ThreeCanvasGateHighlight lab={lab as Lab} />

      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{lab.title}</h1>
          <Badge variant="outline">Week {lab.week}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {lab.persona} · {lab.channel}
        </p>
        <p className="text-xs text-muted-foreground">Lab {lab.id}</p>
      </header>

      {/* Context card: scenario + objectives */}
      {stateRow.history.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scenario</CardTitle>
            <CardDescription>{lab.scenario}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Objectives
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {lab.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <NodeRunner
        lab={lab as Lab}
        node={node}
        attemptId={attemptId}
        state={fsmState}
        terminal={terminal}
      />
    </div>
  );
}

function NodeRunner({
  lab,
  node,
  attemptId,
  state,
  terminal,
}: {
  lab: Lab;
  node: LabFsmNode;
  attemptId: string;
  state: FsmState;
  terminal: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{node.title}</CardTitle>
          <Badge variant="secondary">{node.kind}</Badge>
        </div>
        <CardDescription>{node.body}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location-aware node: surface the 2D panel for inspect/remediate nodes */}
        {(node.kind === 'inspect' || node.kind === 'remediate') &&
          node.locationId &&
          node.objectId && (
            <LabLocationPanel
              lab={lab}
              attemptId={attemptId}
              highlightObjectId={node.objectId}
              nextEventOnEvidence={node.transitions[0]?.event ?? 'evidence-saved'}
              nextEventOnContinue={node.transitions[0]?.event ?? 'evidence-saved'}
              observationPrompt={
                node.kind === 'remediate'
                  ? 'Document the remediation step you took and the result.'
                  : 'What did you observe? Capture the diagnostic details before deciding.'
              }
            />
          )}

        {/* Decision node */}
        {node.kind === 'decide' && node.decisionPointId && (
          <DecisionRunner
            lab={lab}
            attemptId={attemptId}
            decisionPointId={node.decisionPointId}
          />
        )}

        {/* Plain intro with a prompt (hypothesis) */}
        {node.kind === 'intro' && node.prompt && (
          <HypothesisRunner
            lab={lab}
            attemptId={attemptId}
            prompt={node.prompt}
          />
        )}

        {/* Document step */}
        {node.kind === 'document' && (
          <DocumentRunner
            lab={lab}
            attemptId={attemptId}
            prompt={node.prompt ?? 'Write a brief follow-up message.'}
          />
        )}

        {/* Debrief node */}
        {node.kind === 'debrief' && (
          <div className="rounded-md border border-success/40 bg-success/10 p-4">
            <p className="text-sm font-medium text-success">Lab complete.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Review your score on the debrief screen, or return to the{' '}
              <a href="/labs" className="underline">lab list</a>.
            </p>
          </div>
        )}

        {/* Standalone "Continue" buttons for nodes that haven't auto-transitioned */}
        {!terminal &&
          node.kind !== 'decide' &&
          node.kind !== 'inspect' &&
          node.kind !== 'remediate' &&
          node.kind !== 'document' &&
          node.kind !== 'debrief' &&
          !node.prompt && <TransitionButtons lab={lab} attemptId={attemptId} state={state} />}
      </CardContent>
    </Card>
  );
}

function TransitionButtons({
  lab,
  attemptId,
  state,
}: {
  lab: Lab;
  attemptId: string;
  state: FsmState;
}) {
  const events = availableEvents(lab, state);
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No transitions available. Complete the action above to continue.
      </p>
    );
  }

  const labels: Record<string, string> = {
    'intake-recorded': 'Mark intake recorded',
    'evidence-saved': 'Continue',
    'decision-made': 'Continue',
    'scope-recorded': 'Continue',
    'hypothesis-saved': 'Continue',
    'remediation-complete': 'Continue',
    'validation-saved': 'Continue',
    'followup-saved': 'Finish lab',
    'issue-confirmed': 'Continue',
    'fix-applied': 'Continue',
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {events.map((event) => (
        <Button
          key={event}
          onClick={() => {
            void dispatch(lab, attemptId, event);
          }}
        >
          {labels[event] ?? 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

function DecisionRunner({
  lab,
  attemptId,
  decisionPointId,
}: {
  lab: Lab;
  attemptId: string;
  decisionPointId: string;
}) {
  const dp = lab.decisionPoints.find((d) => d.id === decisionPointId);
  if (!dp) return <p className="text-sm text-destructive">Decision point not found.</p>;

  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{dp.prompt}</p>
      <div className="space-y-2">
        {dp.options.map((opt) => {
          const isPicked = picked === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setPicked(opt.id);
                void recordDecision(attemptId, lab.id, dp.id, opt.id);
                void dispatch(lab, attemptId, 'decision-made', { optionId: opt.id });
              }}
              className={cn(
                'w-full rounded-md border p-3 text-left text-sm transition-colors',
                'hover:border-primary/50 hover:bg-accent',
                isPicked && 'border-primary bg-primary/5',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="rounded-md border border-muted-foreground/30 bg-muted/40 p-3 text-sm">
          {dp.options.find((o) => o.id === picked)?.feedback}
        </div>
      )}
    </div>
  );
}

function HypothesisRunner({
  lab,
  attemptId,
  prompt,
}: {
  lab: Lab;
  attemptId: string;
  prompt: string;
}) {
  const [text, setText] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{prompt}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="In one sentence, what is your hypothesis and what evidence supports it?"
        aria-label="Hypothesis"
      />
      <Button
        size="sm"
        disabled={text.trim().length === 0}
        onClick={() => {
          void recordHypothesis(attemptId, lab.id, text.trim());
          void dispatch(lab, attemptId, 'hypothesis-saved', { statement: text.trim() });
        }}
      >
        Save hypothesis
      </Button>
    </div>
  );
}

/**
 * Wraps `ThreeCanvasGate` and passes the current lab's locationId so the
 * 3D scene can highlight the room the learner is in. Lives in its own
 * component so the gate can stay inside `<Suspense>` and avoid pulling
 * the three.js bundle when 2D mode is active.
 */
function ThreeCanvasGateHighlight({ lab }: { lab: Lab }) {
  return <ThreeCanvasGate highlightLocationId={lab.location?.id} />;
}

function DocumentRunner({
  lab,
  attemptId,
  prompt,
}: {
  lab: Lab;
  attemptId: string;
  prompt: string;
}) {
  const [text, setText] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{prompt}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Plain language. No internal IDs. What was wrong, what you did, what to do if it happens again."
        rows={6}
        aria-label="Customer follow-up"
      />
      <Button
        size="sm"
        disabled={text.trim().length === 0}
        onClick={() => {
          void recordEvidence(attemptId, lab.id, 'note', 'Customer follow-up', text.trim());
          void dispatch(lab, attemptId, 'followup-saved', { message: text.trim() });
        }}
      >
        Save follow-up
      </Button>
    </div>
  );
}
