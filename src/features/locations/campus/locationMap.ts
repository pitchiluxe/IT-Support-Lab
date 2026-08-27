import type { Lab } from '@/data/labs/lab.schema';

export interface RoomPlacement {
  locationId: string;
  label: string;
  /** Position on the campus grid (x: 0..cols-1, y: 0..rows-1). */
  x: number;
  y: number;
  /** Lab IDs that take place in this room. */
  labIds: string[];
  /** Optional track for color-coding. */
  track?: string | undefined;
}

/**
 * Auto-derive room positions from the lab manifest. We hash the location id
 * into a stable 2D grid position. The grid is bounded to (cols=8, rows=6) so
 * the 3D scene stays readable.
 */
const COLS = 8;
const ROWS = 6;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface LabSummary {
  id: string;
  title: string;
  location: Lab['location'];
  track: string;
}

/**
 * Build the campus map from a list of labs. Each unique location id gets a
 * stable grid position. Labs that share a location are grouped.
 */
export function buildCampusMap(labs: readonly LabSummary[]): RoomPlacement[] {
  const byLocation = new Map<string, LabSummary[]>();
  for (const lab of labs) {
    const list = byLocation.get(lab.location.id);
    if (list) list.push(lab);
    else byLocation.set(lab.location.id, [lab]);
  }
  const placements: RoomPlacement[] = [];
  for (const [locationId, roomLabs] of byLocation) {
    const x = hash(locationId) % COLS;
    const y = (hash(locationId + ':y') >> 4) % ROWS;
    placements.push({
      locationId,
      label: roomLabs[0]?.location.name ?? locationId,
      x,
      y,
      labIds: roomLabs.map((l) => l.id),
      ...(roomLabs[0]?.track ? { track: roomLabs[0].track } : {}),
    });
  }
  return placements;
}

export const CAMPUS_GRID = { cols: COLS, rows: ROWS };
