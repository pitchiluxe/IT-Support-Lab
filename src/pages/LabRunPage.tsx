import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '@/lib/db/client';
import { RunLab } from '@/features/lab-engine/RunLab';
import { TutorPanel } from '@/features/tutor/TutorPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { evaluateCapstoneGate, DEFAULT_CAPSTONE_THRESHOLD } from '@/features/capstone/gate';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import { useProfileStore } from '@/features/profile/store';

const CAPSTONE_THRESHOLD_KEY = 'capstoneThreshold';

export function LabRunPage() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const [showTutor, setShowTutor] = useState(true);
  const { profileId } = useProfileStore();

  const lab = useLiveQuery(() => (labId ? db.labs.get(labId) : undefined), [labId]);
  const attempt = useLiveQuery(
    () => (labId ? db.attempts.where('labId').equals(labId).first() : undefined),
    [labId],
  );
  // The capstone is the only gated lab. Pull every completed attempt for the
  // profile and run the gate function. Any other lab short-circuits the gate
  // (status.unlocked = true) so the rest of the page stays untouched.
  const completedLabIds = useLiveQuery(
    () =>
      profileId
        ? db.attempts
            .where('profileId')
            .equals(profileId)
            .and((a) => a.status === 'completed')
            .toArray()
            .then((rows) => rows.map((r) => r.labId))
        : Promise.resolve([] as string[]),
    [profileId],
  );
  const capstone = LAB_MANIFEST.find((l) => l.id === 'capstone-01');
  // The threshold is stored in `settings` so deployments can tune it without
  // a code change. We coerce the value defensively — bad input falls back
  // to the default rather than locking the learner out.
  const thresholdRow = useLiveQuery(
    () => db.settings.get(CAPSTONE_THRESHOLD_KEY),
    [],
  );
  const threshold = readThreshold(thresholdRow?.value);
  const gate = capstone
    ? evaluateCapstoneGate(capstone, completedLabIds ?? [], { threshold })
    : null;
  const isCapstone = labId === 'capstone-01';
  const isGated = isCapstone && gate !== null && !gate.unlocked;

  if (!labId) return null;
  if (!lab) return <LabNotFound labId={labId} />;
  if (isGated && gate) {
    return <CapstoneLocked gate={gate} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/labs')}
          aria-label="Back to labs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{lab.title}</h1>
          <p className="text-xs text-muted-foreground">Lab {lab.id}</p>
        </div>
        <Button
          variant={showTutor ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowTutor(!showTutor)}
          aria-label={showTutor ? 'Hide tutor' : 'Show tutor'}
          aria-expanded={showTutor}
        >
          <Bot className="h-3.5 w-3.5" />
          {showTutor ? 'Hide tutor' : 'Show tutor'}
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              showTutor && 'rotate-90',
            )}
          />
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <RunLab labId={labId} />
        </div>
        {showTutor && attempt && (
          <aside
            className="w-full max-w-md overflow-auto border-l p-4"
            aria-label="Tutor side panel"
          >
            <TutorPanel lab={lab} attemptId={attempt.id} />
          </aside>
        )}
      </div>
    </div>
  );
}

function LabNotFound({ labId }: { labId: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">
        Lab <code>{labId}</code> not found.
      </p>
    </div>
  );
}

/**
 * Rendered when the learner tries to open the capstone before completing the
 * phase labs. Shows progress and points them back to the lab list.
 */
function CapstoneLocked({ gate }: { gate: ReturnType<typeof evaluateCapstoneGate> }) {
  const navigate = useNavigate();
  const pct = Math.round(gate.progressPct * 100);
  const thresholdPct = Math.round(gate.threshold * 100);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Capstone is locked</h1>
            <p className="text-sm text-muted-foreground">
              {gate.capstone.title} integrates every skill in the academy. Finish
              at least {thresholdPct}% of the {gate.required.length} phase labs to
              unlock it.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {gate.completed.length} of {gate.required.length} phase labs complete
                </span>
                <span>{pct}% (need {thresholdPct}%)</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label="Capstone unlock progress"
              >
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {gate.labsNeeded > 0 && (
                <p className="text-xs text-muted-foreground">
                  {gate.labsNeeded} more lab{gate.labsNeeded === 1 ? '' : 's'} to go.
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/labs')}>Browse labs</Button>
              <Button variant="outline" onClick={() => navigate('/readiness')}>
                View readiness
              </Button>
            </div>
          </div>
        </div>
      </div>
      {gate.remaining.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold">Still to do</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The first {Math.min(5, gate.remaining.length)} outstanding labs:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {gate.remaining.slice(0, 5).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => navigate(`/lab/${id}`)}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Parse the threshold from a settings value, falling back to default. */
function readThreshold(raw: string | undefined): number {
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_CAPSTONE_THRESHOLD;
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return DEFAULT_CAPSTONE_THRESHOLD;
}
