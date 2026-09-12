import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTrace } from '../store/useTrace.js';

const PALETTE = {
  idle: '#3E5C89',
  compare: '#F2B134',
  swap: '#E4626F',
  pivot: '#B487F5',
  sorted: '#48C79A',
};

// One material per role, shared by every bar — keeps the draw calls cheap.
const MATERIALS = Object.fromEntries(
  Object.entries(PALETTE).map(([role, color]) => [
    role,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.35,
      metalness: 0.12,
    }),
  ])
);

const GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

function roleOf(frame, i) {
  if (frame.swap?.includes(i)) return 'swap';
  if (frame.compare?.includes(i)) return 'compare';
  if (frame.pivot === i) return 'pivot';
  if (frame.sorted.includes(i)) return 'sorted';
  return 'idle';
}

function Bar({ index, value, role, spacing }) {
  const ref = useRef();
  const targetH = value / 9;
  const lift = role === 'swap' || role === 'compare' ? 0.9 : 0;

  // Height and lift are driven here, not through props, so React re-renders
  // never stomp on a half-finished animation.
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.0005, Math.min(dt, 0.05));
    const h = mesh.scale.y + (targetH - mesh.scale.y) * k;
    mesh.scale.set(spacing * 0.72, h, spacing * 0.72);
    const y = h / 2 + lift;
    mesh.position.y += (y - mesh.position.y) * k;
  });

  return (
    <mesh
      ref={ref}
      geometry={GEOMETRY}
      material={MATERIALS[role]}
      position-x={index * spacing}
      castShadow
      receiveShadow
    />
  );
}

export default function SortingScene() {
  const frames = useTrace((s) => s.frames);
  const index = useTrace((s) => s.index);
  const frame = frames[index];
  const n = frame.array.length;
  const spacing = 1.15;
  const width = n * spacing;

  return (
    <group position={[-width / 2 + spacing / 2, -2.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2 - spacing / 2, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width + 4, 10]} />
        <meshStandardMaterial color="#151B2C" roughness={1} />
      </mesh>
      {frame.array.map((value, i) => (
        <Bar key={i} index={i} value={value} role={roleOf(frame, i)} spacing={spacing} />
      ))}
    </group>
  );
}
