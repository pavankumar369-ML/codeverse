import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

const SPHERE = new THREE.SphereGeometry(0.55, 24, 18);

const ROLE = {
  active: { color: '#F2B134', glow: 1.4, scale: 1.35 },
  visited: { color: '#48C79A', glow: 0.7, scale: 1.05 },
  queued: { color: '#B487F5', glow: 0.6, scale: 1.05 },
  idle: { color: '#3E6398', glow: 0.1, scale: 1 },
  hidden: { color: '#1A2438', glow: 0, scale: 0.01 },
};

function position(node, tree) {
  const spacing = 1.9;
  return [
    (node.x - (tree.width - 1) / 2) * spacing,
    -node.depth * 1.75,
    node.depth * 0.55, // a little z-drift so depth reads when you orbit
  ];
}

function Node({ node, tree, role }) {
  const ref = useRef();
  const style = ROLE[role];
  const [x, y, z] = position(node, tree);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.0008, Math.min(dt, 0.05));
    const s = mesh.scale.x + (style.scale - mesh.scale.x) * k;
    mesh.scale.setScalar(s);
  });

  return (
    <group position={[x, y, z]}>
      <mesh ref={ref} geometry={SPHERE} scale={0.01} castShadow>
        <meshStandardMaterial
          color={style.color}
          emissive={style.color}
          emissiveIntensity={style.glow}
          roughness={0.3}
          metalness={0.15}
        />
      </mesh>
      {role !== 'hidden' && (
        <Text position={[0, 0, 0.75]} fontSize={0.42} color="#F0F5FF" anchorX="center" anchorY="middle" outlineWidth={0.014} outlineColor="#0B1120">
          {node.value}
        </Text>
      )}
    </group>
  );
}

export default function TreeScene({ frame }) {
  const tree = frame.tree;

  const roles = useMemo(() => {
    const present = new Set(frame.present);
    const visited = new Set(frame.visited);
    const queued = new Set(frame.compare);
    return tree.nodes.map((n) => {
      if (!present.has(n.id)) return 'hidden';
      if (frame.active === n.id) return 'active';
      if (visited.has(n.id)) return 'visited';
      if (queued.has(n.id)) return 'queued';
      return 'idle';
    });
  }, [frame, tree]);

  const visibleEdges = useMemo(() => {
    const present = new Set(frame.present);
    return tree.edges
      .filter(([a, b]) => present.has(a) && present.has(b))
      .map(([a, b]) => ({
        key: `${a}-${b}`,
        points: [position(tree.nodes[a], tree), position(tree.nodes[b], tree)],
        lit: frame.visited.includes(a) && frame.visited.includes(b),
      }));
  }, [frame, tree]);

  return (
    <group position={[0, 3.5, 0]}>
      {visibleEdges.map((e) => (
        <Line
          key={e.key}
          points={e.points}
          color={e.lit ? '#48C79A' : '#283B5E'}
          lineWidth={e.lit ? 2.6 : 1.4}
        />
      ))}
      {tree.nodes.map((n, i) => (
        <Node key={n.id} node={n} tree={tree} role={roles[i]} />
      ))}

      {frame.output && frame.output.length > 0 && (
        <Text
          position={[0, 2.6, 0]}
          fontSize={0.46}
          color="#8FE3C4"
          anchorX="center"
          maxWidth={22}
        >
          {frame.output.join('  ')}
        </Text>
      )}
    </group>
  );
}
