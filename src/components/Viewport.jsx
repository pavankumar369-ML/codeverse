import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, ContactShadows, Text } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useTrace, frameAt } from '../store/useTrace.js'
import { byId } from '../algorithms/index.js'
import SortingScene from '../scenes/SortingScene.jsx'
import GridScene from '../scenes/GridScene.jsx'
import StackScene from '../scenes/StackScene.jsx'
import TreeScene from '../scenes/TreeScene.jsx'

const VIEWS = {
  sorting: { position: [0, 9, 26], target: [0, 0, 0], race: [0, 14, 44], spread: 17 },
  pathfinding: { position: [0, 20, 21], target: [0, -2, 0], race: [0, 34, 30], spread: 27 },
  recursion: { position: [2, 6, 20], target: [0, 1, 0], race: [0, 8, 34], spread: 15 },
  tree: { position: [0, 2, 24], target: [0, -3, 0], race: [0, 3, 42], spread: 26 },
}

const SCENES = {
  sorting: SortingScene,
  pathfinding: GridScene,
  recursion: StackScene,
  tree: TreeScene,
}

function CameraRig({ category, racing, controls }) {
  const { camera } = useThree()
  const goal = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const settled = useRef(false)
  const cinematic = useTrace((s) => s.cinematic)
  const playing = useTrace((s) => s.playing)

  useEffect(() => {
    const view = VIEWS[category]
    goal.current.set(...(racing ? view.race : view.position))
    look.current.set(...view.target)
    settled.current = false
  }, [category, racing])

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.002, Math.min(dt, 0.05))
    if (!settled.current) {
      camera.position.lerp(goal.current, k)
      if (controls.current) {
        controls.current.target.lerp(look.current, k)
        controls.current.update()
      }
      if (camera.position.distanceTo(goal.current) < 0.06) settled.current = true
      return
    }
    if (controls.current) {
      controls.current.autoRotate = cinematic && !playing && !racing
      controls.current.autoRotateSpeed = 0.35
    }
  })
  return null
}

function Lane({ Scene, frame, label, x, finished }) {
  if (!frame) return null
  return (
    <group position={[x, 0, 0]}>
      <Scene frame={frame} />
      <Text
        position={[0, 11.5, 0]}
        fontSize={0.72}
        color={finished ? '#48C79A' : '#DCE5F7'}
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#080C16"
      >
        {label}
        {finished ? '  ✓' : ''}
      </Text>
    </group>
  )
}

export default function Viewport() {
  const algoId = useTrace((s) => s.algoId)
  const opponentId = useTrace((s) => s.opponentId)
  const index = useTrace((s) => s.index)
  const frames = useTrace((s) => s.frames)
  const framesB = useTrace((s) => s.framesB)
  const controls = useRef()

  const algo = byId(algoId)
  const category = algo.category
  const Scene = SCENES[category]
  const racing = Boolean(opponentId && framesB)
  const spread = racing ? VIEWS[category].spread : 0

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: VIEWS[category].position, fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0A0F1C']} />
      <fog attach="fog" args={['#0A0F1C', 40, 110]} />

      <hemisphereLight args={['#7FA8FF', '#0A0F1C', 0.5]} />
      <directionalLight position={[10, 20, 8]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-14, 8, -10]} intensity={0.45} color="#6EA8FF" />
      <pointLight position={[0, 6, 10]} intensity={22} distance={44} color="#4EA8DE" />

      <Lane
        Scene={Scene}
        frame={frameAt(frames, index)}
        label={racing ? algo.name : ''}
        x={-spread}
        finished={racing && index >= frames.length - 1}
      />
      {racing && (
        <Lane
          Scene={Scene}
          frame={frameAt(framesB, index)}
          label={byId(opponentId).name}
          x={spread}
          finished={index >= framesB.length - 1}
        />
      )}

      <ContactShadows position={[0, -3.3, 0]} opacity={0.45} scale={90} blur={2.4} far={12} />

      <Grid
        position={[0, -3.35, 0]}
        args={[120, 120]}
        cellSize={1}
        cellColor="#182238"
        sectionSize={8}
        sectionColor="#22314F"
        fadeDistance={85}
        infiniteGrid
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={8}
        maxDistance={90}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraRig category={category} racing={racing} controls={controls} />

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.65} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  )
}
