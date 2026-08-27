import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Laptop, Phone, Server, type LucideIcon } from 'lucide-react';
import { getLocation, getObject, type LocationObjectSeed } from './registry';
import { ObjectInspector } from './inspectors/pickInspector';
import { recordEvidence, dispatch as dispatchEvent } from '@/features/lab-engine/run';
import type { Lab } from '@/data/labs/lab.schema';

export interface LabLocationPanelProps {
  lab: Lab;
  attemptId: string;
  /** ID of the object the active lab node wants you to inspect. */
  highlightObjectId?: string;
  /** Event name to dispatch when the learner records an observation. */
  nextEventOnEvidence: string;
  /** After the learner records one or more observations, dispatch this transition. */
  nextEventOnContinue: string;
  /** Optional prompt shown above the observation textarea. */
  observationPrompt?: string;
}

/**
 * The 2D location panel: a two-column layout with an object list on the left
 * and the active inspector on the right. Replaces the linear card flow for
 * nodes that reference a `locationId` and `objectId`.
 *
 * Accessibility:
 *  - Object list is a `role="listbox"` with roving tab index (arrow keys).
 *  - Each object has an `aria-label` describing what it is.
 *  - The focus is restored to the previously selected object on re-render.
 */
export function LabLocationPanel({
  lab,
  attemptId,
  highlightObjectId,
  nextEventOnEvidence,
  nextEventOnContinue,
  observationPrompt,
}: LabLocationPanelProps) {
  const location = getLocation(lab);
  const initialObjectId =
    highlightObjectId ?? location.objects[0]?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(initialObjectId);
  const [observation, setObservation] = useState('');
  const [saved, setSaved] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Re-sync when the node's target object changes
  useEffect(() => {
    if (highlightObjectId) setActiveId(highlightObjectId);
  }, [highlightObjectId]);

  const active = activeId ? getObject(location, activeId) : null;
  const recentEvidence = useLiveQuery(
    () =>
      db.evidence
        .where('attemptId')
        .equals(attemptId)
        .reverse()
        .sortBy('createdAt'),
    [attemptId],
  );

  function onKey(e: KeyboardEvent<HTMLUListElement>) {
    if (!location.objects.length) return;
    const idx = location.objects.findIndex((o) => o.id === activeId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = location.objects[(idx + 1) % location.objects.length];
      if (next) setActiveId(next.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev =
        location.objects[(idx - 1 + location.objects.length) % location.objects.length];
      if (prev) setActiveId(prev.id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = location.objects[0];
      if (first) setActiveId(first.id);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = location.objects[location.objects.length - 1];
      if (last) setActiveId(last.id);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{location.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Use ↑/↓ to move between objects. Each object reveals the diagnostic
          state you should record as evidence.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          {/* Object list */}
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Objects in this location"
            onKeyDown={onKey}
            tabIndex={0}
            className="space-y-1 outline-none"
          >
            {location.objects.map((o) => (
              <li key={o.id} role="presentation">
                <ObjectListButton
                  object={o}
                  isActive={o.id === activeId}
                  isHighlighted={o.id === highlightObjectId}
                  onSelect={() => setActiveId(o.id)}
                />
              </li>
            ))}
          </ul>

          {/* Active inspector */}
          <div className="space-y-4">
            {active ? (
              <ObjectInspector
                objectId={active.id}
                state={active.state}
                lab={lab}
                attemptId={attemptId}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No objects.</p>
            )}

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {observationPrompt ?? 'What did you observe?'}
              </p>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Describe what you see. Be specific — error messages, IP addresses, status codes."
                className="mt-2"
                rows={3}
                aria-label="Observation"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={observation.trim().length === 0}
                  onClick={() => {
                    void recordEvidence(
                      attemptId,
                      lab.id,
                      'note',
                      active?.name ?? 'Observation',
                      observation.trim(),
                    );
                    void dispatchEvent(lab, attemptId, nextEventOnEvidence, {
                      text: observation.trim(),
                      objectId: active?.id,
                    });
                    setObservation('');
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                >
                  Save observation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void dispatchEvent(lab, attemptId, nextEventOnContinue);
                  }}
                >
                  Continue without saving
                </Button>
                {saved && <span className="text-xs text-success">Saved.</span>}
              </div>
            </div>

            {/* Recent evidence log */}
            {recentEvidence && recentEvidence.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Evidence captured
                </p>
                <ul className="space-y-1 text-xs">
                  {recentEvidence.slice(0, 5).map((e) => (
                    <li
                      key={e.id}
                      className="rounded border bg-background/50 p-2"
                    >
                      <span className="font-medium">{e.title}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        — {e.body.slice(0, 100)}
                        {e.body.length > 100 ? '…' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ObjectListButton({
  object,
  isActive,
  isHighlighted,
  onSelect,
}: {
  object: LocationObjectSeed;
  isActive: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
}) {
  const Icon = iconForObject(object.id);
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      aria-label={object.name}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : 'hover:border-primary/50 hover:bg-accent',
        isHighlighted && 'ring-2 ring-primary/40',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{object.name}</span>
    </button>
  );
}

function iconForObject(objectId: string): LucideIcon {
  if (objectId.includes('phone')) return Phone;
  if (objectId.includes('pc') || objectId.includes('desktop') || objectId.includes('facilities'))
    return Server;
  return Laptop;
}

/** Re-export for tests that want to assert the registry contract. */
export { getLocation } from './registry';
export type { LocationSeed } from './registry';
