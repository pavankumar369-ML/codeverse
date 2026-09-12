import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useTrace } from '../store/useTrace.js';
import SortingScene from '../scenes/SortingScene.jsx';
import GridScene from '../scenes/GridScene.jsx';
import { byId } from '../algorithms/index.js';

const CAMERAS = {
  sorting: { position: [0, 10, 26], fov: 45 },
  pathfinding: { position: [0, 20, 22], fov: 45 },
};

export default function Viewport() {
  const algoId = useTrace((s) => s.algoId);
  const category = byId(algoId).category;

  return (
    <Canvas
      key={category}
      shadows
      dpr={[1, 1.75]}
      camera={CAMERAS[category]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0D1220']} />
      <fog attach="fog" args={['#0D1220', 34, 80]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-12, 8, -10]} intensity={0.4} color="#6EA8FF" />

      {category === 'sorting' ? <SortingScene /> : <GridScene />}

      <Grid
        position={[0, -2.52, 0]}
        args={[80, 80]}
        cellSize={1}
        cellColor="#1B2740"
        sectionSize={8}
        sectionColor="#243456"
        fadeDistance={60}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={10}
        maxDistance={60}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
