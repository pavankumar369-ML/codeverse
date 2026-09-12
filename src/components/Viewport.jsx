import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useTrace } from '../store/useTrace.js'
import { byId } from '../algorithms/index.js'
import SortingScene from '../scenes/SortingScene.jsx'
import GridScene from '../scenes/GridScene.jsx'
import StackScene from '../scenes/StackScene.jsx'
import TreeScene from '../scenes/TreeScene.jsx'

const VIEWS = {
  sorting: { position: [0, 9, 26], target: [0, 0, 0] },
  pathfinding: { position: [0, 20, 21], target: [0, -2, 0] },
  recursion: { position: [2, 6, 20], target: [0, 1, 0] },
  tree: { position: [0, 2, 24], target: [0, -3, 0] },
}

const SCENES = {
  sorting: SortingScene,
  pathfinding: GridScene,
  recursion: StackScene,
  tree: TreeScene,
}

// Glides the camera to the new category's framing instead of snapping.
function CameraRig({ category, controls }) {
  const { camera } = useThree()
  const goal = useRef(new THREE.Vector3(...VIEWS[category].position))
  const look = useRef(new THREE.Vector3(...VIEWS[category].target))
  const settled = useRef(false)
  const cinematic = useTrace((s) => s.cinematic)
  const playing = useTrace((s) => s.playing)

  useEffect(() => {
    goal.current.set(...VIEWS[category].position)
    look.current.set(...VIEWS[category].target)
    settled.current = false
  }, [category])

  useFrame((_, dt) => {
    if (!settled.current) {
      camera.position.lerp(goal.current, 1 - Math.pow(0.002, Math.min(dt, 0.05)))
      if (controls.current) {
        controls.current.target.lerp(look.current, 1 - Math.pow(0.002, Math.min(dt, 0.05)))
        controls.current.update()
      }
      if (camera.position.distanceTo(goal.current) < 0.06) settled.current = true
      return
    }
    // Idle drift: only while nothing is playing, so it never fights the action.
    if (cinematic && !playing && controls.current) {
      controls.current.autoRotate = true
      controls.current.autoRotateSpeed = 0.35
    } else if (controls.current) {
      controls.current.autoRotate = false
    }
  })
  return null
}

export default function Viewport() {
  const algoId = useTrace((s) => s.algoId)
  const category = byId(algoId).category
  const Scene = SCENES[category]
  const controls = useRef()

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: VIEWS[category].position, fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0A0F1C']} />
      <fog attach="fog" args={['#0A0F1C', 34, 90]} />

      <hemisphereLight args={['#7FA8FF', '#0A0F1C', 0.5]} />
      <directionalLight position={[10, 20, 8]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-14, 8, -10]} intensity={0.45} color="#6EA8FF" />
      <pointLight position={[0, 6, 10]} intensity={22} distance={40} color="#4EA8DE" />

      <Scene />

      <ContactShadows position={[0, -3.3, 0]} opacity={0.45} scale={60} blur={2.4} far={12} />

      <Grid
        position={[0, -3.35, 0]}
        args={[80, 80]}
        cellSize={1}
        cellColor="#182238"
        sectionSize={8}
        sectionColor="#22314F"
        fadeDistance={65}
        infiniteGrid
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={8}
        maxDistance={70}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraRig category={category} controls={controls} />

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.65} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  )
}
