import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTrace } from '../store/useTrace.js';

const COLORS = {
  empty: '#22304D',
  slow: '#33456B',
  wall: '#0B111F',
  visited: '#2F6BA8',
  frontier: '#F2B134',
  current: '#FFFFFF',
  path: '#48C79A',
  start: '#4EA8DE',
  goal: '#E4626F',
};

const HEIGHTS = {
  empty: 0.25,
  slow: 0.7,
  wall: 1.9,
  visited: 0.45,
  frontier: 1.1,
  current: 1.5,
  path: 1.35,
  start: 1.2,
  goal: 1.2,
};

const CELL = 1;
const GEOMETRY = new THREE.BoxGeometry(CELL * 0.9, 1, CELL * 0.9);
const dummy = new THREE.Object3D();
const color = new THREE.Color();

function stateOf(grid, frame, id, visitedSet, frontierSet, pathSet) {
  if (grid.walls[id]) return 'wall';
  if (pathSet.has(id)) return 'path';
  if (id === grid.start) return 'start';
  if (id === grid.goal) return 'goal';
  if (id === frame.current) return 'current';
  if (frontierSet.has(id)) return 'frontier';
  if (visitedSet.has(id)) return 'visited';
  return grid.weights[id] > 1 ? 'slow' : 'empty';
}

export default function GridScene({ frame }) {
  const grid = useTrace((s) => s.grid);
  const meshRef = useRef();

  const size = grid.cols * grid.rows;

  const states = useMemo(() => {
    const visitedSet = new Set(frame.visited);
    const frontierSet = new Set(frame.frontier);
    const pathSet = new Set(frame.path);
    return Array.from({ length: size }, (_, id) =>
      stateOf(grid, frame, id, visitedSet, frontierSet, pathSet)
    );
  }, [grid, frame, size]);

  // One instanced mesh for the whole board: 400 cells stay well inside budget
  // on integrated graphics because it is a single draw call.
  const heights = useRef(new Float32Array(size).fill(0.25));

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.0005, Math.min(dt, 0.05));
    for (let id = 0; id < size; id++) {
      const state = states[id];
      const target = HEIGHTS[state];
      heights.current[id] += (target - heights.current[id]) * k;
      const h = heights.current[id];
      const r = Math.floor(id / grid.cols);
      const c = id % grid.cols;
      dummy.position.set(
        (c - grid.cols / 2) * CELL,
        h / 2,
        (r - grid.rows / 2) * CELL
      );
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(id, dummy.matrix);
      mesh.setColorAt(id, color.set(COLORS[state]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, -2.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[grid.cols + 2, grid.rows + 2]} />
        <meshStandardMaterial color="#101725" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[GEOMETRY, undefined, size]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.45} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
