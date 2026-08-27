import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { buildCampusMap } from './locationMap';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface Props {
  /** Highlight this locationId (current lab's room) so the learner sees where they are. */
  highlightLocationId?: string;
  /** The id of the canvas this list describes. */
  canvasId: string;
}

/**
 * Keyboard-accessible parallel to the 3D campus scene. The canvas is
 * `aria-hidden` and decorative; this list is the real, reachable UI. Each
 * room is a button with an aria-label, navigates to the first lab in that
 * room on click, and supports roving tab index (arrow keys move the
 * selection without trapping the user in the list).
 *
 * This is the same set of click targets as the 3D scene — both stay in
 * lockstep because both read from the same `buildCampusMap` placements.
 */
export function RoomList({ highlightLocationId, canvasId }: Props) {
  const labs = useLiveQuery(() => db.labs.toArray(), []);
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const placements = buildCampusMap(
    (labs ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      location: l.location,
      track: l.track,
    })),
  );

  // Keep the active index in range as labs load/unload.
  useEffect(() => {
    if (activeIdx >= placements.length) setActiveIdx(0);
  }, [placements.length, activeIdx]);

  function onKey(e: KeyboardEvent<HTMLUListElement>) {
    if (placements.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (activeIdx + 1) % placements.length;
      setActiveIdx(next);
      buttonRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (activeIdx - 1 + placements.length) % placements.length;
      setActiveIdx(prev);
      buttonRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
      buttonRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = placements.length - 1;
      setActiveIdx(last);
      buttonRefs.current[last]?.focus();
    }
  }

  return (
    <div
      className="grid gap-3 md:grid-cols-[260px_1fr]"
      role="group"
      aria-describedby={canvasId}
    >
      {/* Accessible room list — the keyboard target. */}
      <ul
        aria-label="Campus rooms (use arrow keys to move)"
        onKeyDown={onKey}
        className="max-h-[60vh] space-y-1 overflow-y-auto rounded-md border bg-card p-2"
        data-testid="room-list"
      >
        {placements.length === 0 && (
          <li className="p-2 text-xs text-muted-foreground">Loading rooms…</li>
        )}
        {placements.map((p, i) => {
          const firstLab = LAB_MANIFEST.find((l) => l.id === p.labIds[0]);
          const isHighlighted = p.locationId === highlightLocationId;
          return (
            <li key={p.locationId}>
              <button
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                type="button"
                onClick={() => {
                  if (firstLab) navigate(`/lab/${firstLab.id}`);
                }}
                aria-current={isHighlighted ? 'true' : undefined}
                aria-label={`${p.label} — ${p.labIds.length} lab${p.labIds.length === 1 ? '' : 's'}${firstLab ? `. Press Enter to start ${firstLab.title}.` : ''}`}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm transition-colors',
                  isHighlighted
                    ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                    : 'border-transparent hover:border-primary/50 hover:bg-accent',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                <MapPin
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isHighlighted ? 'text-amber-500' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.labIds.length} lab{p.labIds.length === 1 ? '' : 's'}
                    {p.track ? ` · ${p.track}` : ''}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Slot for the 3D canvas — kept decorative. The canvas itself is
          aria-hidden; this list is the real interface. */}
      <div className="flex items-center justify-center rounded-md border bg-slate-900 text-xs text-slate-200">
        <p className="p-4 text-center">
          The 3D scene below is decorative. Use the list on the left to navigate rooms
          with the keyboard, or click a room directly in the scene with a mouse.
        </p>
      </div>
    </div>
  );
}
