import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';

export type CampusMode = '2d' | '3d';

const SETTINGS_KEY = 'campusMode';

function envFlagEnabled(): boolean {
  // `import.meta.env` is statically replaced at build time. Comparing against
  // the string 'true' is the canonical way to read a boolean env var.
  return import.meta.env['VITE_ENABLE_3D'] === 'true';
}

function readUrlMode(): CampusMode | null {
  if (typeof window === 'undefined') return null;
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === '2d' || mode === '3d') return mode;
  return null;
}

/**
 * Resolve whether the campus scene should render in 3D. Precedence (highest wins):
 *   1. `?mode=2d` / `?mode=3d` URL param — explicit, transient.
 *   2. Learner preference stored at `settings.campusMode` ('2d' | '3d').
 *   3. `VITE_ENABLE_3D` build-time env flag.
 *   4. Default = '3d' when the flag is on (the 3D campus is the headline
 *      view; learners can opt back to 2D in Settings).
 *   5. Fallback = '2d' when the flag is off (the 3D bundle is not built in).
 */
export function resolveCampusMode(
  stored: string | null | undefined,
): CampusMode {
  if (!envFlagEnabled()) return '2d';
  const urlMode = readUrlMode();
  if (urlMode) return urlMode;
  if (stored === '2d') return '2d';
  return '3d';
}

/**
 * Hook: returns the current campus mode for this device, live-tracked from
 * Dexie so a settings change reflects on the next render.
 */
export function useCampusMode(): CampusMode {
  const stored = useLiveQuery(() => db.settings.get(SETTINGS_KEY), []);
  const value = typeof stored?.value === 'string' ? stored.value : null;
  return resolveCampusMode(value);
}

/** Persist the learner's preference. No-op when the URL forces a mode. */
export async function setCampusMode(mode: CampusMode): Promise<void> {
  if (readUrlMode() !== null) return; // URL overrides
  await db.settings.put({ key: SETTINGS_KEY, value: mode });
}

export const CAMPUS_MODE_KEY = SETTINGS_KEY;
