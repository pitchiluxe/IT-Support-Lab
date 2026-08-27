import { Html } from '@react-three/drei';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import type { RoomPlacement } from './locationMap';
import { BoxGeometry } from 'three';

interface Props {
  placement: RoomPlacement;
  cellSize: number;
  /** When true, the room box glows gold instead of its track color. */
  highlighted?: boolean;
}

/** Color-code rooms by their primary track. */
const TRACK_COLOR: Record<string, string> = {
  'service-desk': '#60a5fa', // blue-400
  windows: '#818cf8', // indigo-400
  apple: '#a78bfa', // violet-400
  'google-workspace': '#f472b6', // pink-400
  mdm: '#fb923c', // orange-400
  network: '#34d399', // emerald-400
  'classroom-tech': '#fbbf24', // amber-400
  asset: '#94a3b8', // slate-400
  projects: '#22d3ee', // cyan-400
  documentation: '#c084fc', // purple-400
  'incident-response': '#f87171', // red-400
  operations: '#a3a3a3', // neutral-400
  capstone: '#facc15', // yellow-400
};

const HIGHLIGHT_COLOR = '#facc15'; // yellow-400
const WALL_BOX = new BoxGeometry(1.6, 0.6, 1.6);

export function RoomObject({ placement, cellSize, highlighted }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const baseColor = TRACK_COLOR[placement.track ?? ''] ?? '#94a3b8';
  const color = highlighted ? HIGHLIGHT_COLOR : baseColor;

  const firstLab = LAB_MANIFEST.find((l) => l.id === placement.labIds[0]);
  const click = () => {
    if (firstLab) navigate(`/lab/${firstLab.id}`);
  };

  return (
    <group
      position={[(placement.x - (cellSize / 2) + 0.5) * 2, 0, (placement.y - (cellSize / 2) + 0.5) * 2]}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = firstLab ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Outer glow halo — a slightly-larger, more-transparent mesh behind the
          floor tile. It bleeds out past the box edges to create the halo effect. */}
      {highlighted && (
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[2.0, 0.12, 2.0]} />
          <meshStandardMaterial
            color={HIGHLIGHT_COLOR}
            opacity={hovered ? 0.25 : 0.15}
            transparent
            emissive={HIGHLIGHT_COLOR}
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
      {/* Floor tile */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial
          color={color}
          opacity={hovered || highlighted ? 1 : 0.85}
          transparent
          emissive={highlighted ? HIGHLIGHT_COLOR : '#000000'}
          // Cranked up so the highlighted room really glows:
          // idle = 0.7 (strong sustained glow), hover = 1.0 (full glow)
          emissiveIntensity={highlighted ? (hovered ? 1.0 : 0.7) : 0}
        />
      </mesh>
      {/* Wall outline — bright yellow when highlighted so it stands out from
          the dark campus background; neutral dark gray otherwise. */}
      <lineSegments position={[0, 0.1, 0]}>
        <edgesGeometry args={[WALL_BOX]} />
        <lineBasicMaterial color={highlighted ? HIGHLIGHT_COLOR : '#1f2937'} />
      </lineSegments>
      {hovered && firstLab && (
        <Html
          // The Html element renders a real DOM div on top of the canvas.
          // We must set `pointerEvents: 'none'` on its root container so the
          // div doesn't capture the pointer — otherwise:
          //   1. The room's onPointerOut fires when the cursor enters the
          //      bubble, the bubble disappears, then onPointerOver fires
          //      again and the bubble pops back in (a flicker loop).
          //   2. Clicks on the bubble never reach the room's onClick.
          // The pointerEvents prop on drei's Html maps to the wrapper div.
          pointerEvents="none"
          position={[0, 1.2, 0]}
          center
        >
          <div
            // Solid white background, no transparency, so the box does not
            // visually bleed into the 3D scene.
            className="pointer-events-none select-none whitespace-nowrap rounded-md border border-slate-700 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-lg"
            data-testid="room-tooltip"
          >
            <p className="font-semibold">{placement.label}</p>
            <p className="text-slate-500">
              {placement.labIds.length} lab{placement.labIds.length === 1 ? '' : 's'}
            </p>
            <p className="text-blue-600">Click to start</p>
          </div>
        </Html>
      )}
    </group>
  );
}
