import { lazy, Suspense, useId } from 'react';
import { useCampusMode } from './useCampusMode';
import { RoomList } from './campus/RoomList';

interface Props {
  /** Passed through to CampusScene to highlight the current lab's room. */
  highlightLocationId?: string;
}

const CANVAS_ID_BASE = 'campus-canvas';

/**
 * The 3D campus gate. Loads the 3D scene lazily when the current campus
 * mode is '3d'. The 2D location panel is the always-available fallback and
 * is rendered by the caller; this component only contributes the 3D layer
 * (or nothing, when in 2D mode).
 *
 * Mode resolution lives in `useCampusMode` so the Settings page and the
 * gate stay in lockstep.
 *
 * Accessibility: the 3D canvas is `aria-hidden` because it has no semantic
 * content for screen readers. A parallel keyboard-accessible room list
 * (`RoomList`) is rendered alongside the canvas; sighted mouse users can
 * click the canvas, keyboard users navigate the list, and both reach the
 * same destinations.
 */
const CampusSceneLazy = lazy(() =>
  import('./campus/CampusScene').then((m) => ({ default: m.CampusScene })),
);

export function ThreeCanvasGate({ highlightLocationId }: Props) {
  const mode = useCampusMode();
  const canvasId = useId() + CANVAS_ID_BASE;
  if (mode !== '3d') return null;

  return (
    <Suspense fallback={<div className="h-32 animate-pulse rounded-lg border bg-muted/30" />}>
      <div className="space-y-3">
        <div id={canvasId} aria-hidden="true">
          <CampusSceneLazy
            {...(highlightLocationId !== undefined ? { highlightLocationId } : {})}
          />
        </div>
        <RoomList
          {...(highlightLocationId !== undefined ? { highlightLocationId } : {})}
          canvasId={canvasId}
        />
      </div>
    </Suspense>
  );
}


