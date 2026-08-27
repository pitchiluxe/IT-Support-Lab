import type { Lab } from '@/data/labs/lab.schema';

/**
 * The location registry turns a `Lab.location` seed into a runtime-friendly
 * shape that the 2D panel can render. It is intentionally minimal: location
 * name, ordered list of objects, and the deterministic state each one starts
 * with. The 3D renderer (when wired) will reuse the same registry.
 *
 * For the MVP we only ship the 2D surface. When the 3D canvas is added, the
 * `<ThreeCanvasGate />` will gate on `featureFlag3D` and fall back to the
 * `<LabLocationPanel />` we render today.
 */

export interface LocationObjectSeed {
  id: string;
  name: string;
  /** Free-form lab-defined state. Each inspector knows how to render it. */
  state: Record<string, unknown>;
}

export interface LocationSeed {
  id: string;
  name: string;
  objects: LocationObjectSeed[];
}

/** Read the location from a lab. Throws if the lab has no location. */
export function getLocation(lab: Lab): LocationSeed {
  return {
    id: lab.location.id,
    name: lab.location.name,
    objects: lab.location.objects.map((o) => ({
      id: o.id,
      name: o.name,
      state: o.state as Record<string, unknown>,
    })),
  };
}

/** Find one object inside a location. */
export function getObject(loc: LocationSeed, objectId: string): LocationObjectSeed | undefined {
  return loc.objects.find((o) => o.id === objectId);
}
