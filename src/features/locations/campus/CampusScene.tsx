import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { RoomObject } from './RoomObject';
import { buildCampusMap, CAMPUS_GRID } from './locationMap';

interface Props {
  /** When set, the room with this locationId glows gold to indicate the current lab. */
  highlightLocationId?: string;
}

/**
 * 3D campus. Top-down isometric view of the school building. Each room
 * (location) is a colored box placed on a grid. Hovering shows a label,
 * clicking navigates to the first lab in that room.
 */
export function CampusScene({ highlightLocationId }: Props) {
  const labs = useLiveQuery(() => db.labs.toArray(), []);

  // Build placements from the labs in Dexie. The schema's location is a
  // discriminated subset that we coerce to the LabSummary type.
  const placements = buildCampusMap(
    (labs ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      location: l.location,
      track: l.track,
    })),
  );

  return (
    <div className="h-[60vh] w-full overflow-hidden rounded-lg border bg-slate-900" aria-hidden="true">
      <Canvas
        camera={{ position: [CAMPUS_GRID.cols, 14, CAMPUS_GRID.rows + 4], fov: 35 }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 15, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Grid
            args={[CAMPUS_GRID.cols * 2, CAMPUS_GRID.rows * 2]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#475569"
            sectionSize={4}
            sectionThickness={1}
            sectionColor="#94a3b8"
            fadeDistance={20}
            fadeStrength={1}
            infiniteGrid={false}
            position={[0, 0.001, 0]}
          />
          {placements.map((p) => (
            <RoomObject
              key={p.locationId}
              placement={p}
              cellSize={CAMPUS_GRID.cols}
              highlighted={p.locationId === highlightLocationId}
            />
          ))}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={6}
            maxDistance={30}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
