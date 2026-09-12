import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const STATUS = {
  calling: { color: '#4EA8DE', glow: 0.9 },
  waiting: { color: '#3E5C89', glow: 0.12 },
  returning: { color: '#48C79A', glow: 1.1 },
  memo: { color: '#B487F5', glow: 1.0 },
};

const SLAB = new THREE.BoxGeometry(1, 0.62, 2.1);
const DISK = new THREE.CylinderGeometry(1, 1, 0.42, 28);

function Slab({ item, i }) {
  const ref = useRef();
  const style = STATUS[item.status] ?? STATUS.waiting;
  const width = Math.max(2.6, 7.4 - item.depth * 0.55);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.0006, Math.min(dt, 0.05));
    mesh.scale.x += (width - mesh.scale.x) * k;
    mesh.scale.z += (1 - mesh.scale.z) * k;
    mesh.position.y += (i * 0.78 - mesh.position.y) * k;
  });

  return (
    <group>
      <mesh ref={ref} geometry={SLAB} position={[item.depth * 0.28, i * 0.78 + 2, 0]} scale={[0.1, 1, 0.1]} castShadow>
        <meshStandardMaterial
          color={style.color}
          emissive={style.color}
          emissiveIntensity={style.glow}
          roughness={0.32}
          metalness={0.2}
        />
      </mesh>
      <Text
        position={[item.depth * 0.28, i * 0.78, 1.14]}
        fontSize={0.3}
        color="#EAF1FF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#0B1120"
      >
        {item.label}
        {item.value !== null && item.value !== undefined ? `  →  ${item.value}` : ''}
      </Text>
    </group>
  );
}

function Pegs({ pegs }) {
  const names = ['A', 'B', 'C'];
  return (
    <group position={[9.5, 0, 0]}>
      {names.map((peg, p) => (
        <group key={peg} position={[(p - 1) * 4.2, 0, 0]}>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 3.4, 12]} />
            <meshStandardMaterial color="#2B3A5C" roughness={0.8} />
          </mesh>
          <Text position={[0, -0.5, 0]} fontSize={0.42} color="#8A97B4" anchorX="center">
            {peg}
          </Text>
          {pegs[peg].map((disk, d) => (
            <mesh key={disk} geometry={DISK} position={[0, 0.25 + d * 0.46, 0]} scale={[0.35 + disk * 0.28, 1, 0.35 + disk * 0.28]} castShadow>
              <meshStandardMaterial
                color={['#4EA8DE', '#48C79A', '#F2B134', '#E4626F', '#B487F5', '#6EE7E7'][disk % 6]}
                emissive={['#4EA8DE', '#48C79A', '#F2B134', '#E4626F', '#B487F5', '#6EE7E7'][disk % 6]}
                emissiveIntensity={0.35}
                roughness={0.35}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function StackScene({ frame }) {
  const hasPegs = Boolean(frame.pegs);
  const offsetX = hasPegs ? -7 : 0;

  return (
    <group position={[offsetX, -3.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#131B2C" roughness={1} />
      </mesh>

      {frame.stack.map((item, i) => (
        <Slab key={item.key} item={item} i={i} />
      ))}

      {frame.stack.length === 0 && (
        <Text position={[0, 1.4, 0]} fontSize={0.42} color="#6B7A9C" anchorX="center">
          the stack is empty
        </Text>
      )}

      {hasPegs && <Pegs pegs={frame.pegs} />}

      {frame.output && frame.output.length > 0 && (
        <Text
          position={[0, 9.2, 0]}
          fontSize={0.34}
          color="#8FE3C4"
          anchorX="center"
          maxWidth={16}
        >
          {frame.output.slice(-12).join('  ')}
        </Text>
      )}
    </group>
  );
}
