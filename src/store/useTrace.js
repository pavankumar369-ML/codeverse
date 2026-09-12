import { create } from 'zustand'
import { byId, makeGrid, makeTreeValues } from '../algorithms/index.js'

function randomArray(n, seed = Date.now()) {
  let s = Math.abs(seed) % 233280
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: n }, () => 5 + Math.floor(rand() * 95))
}

// Hanoi doubles its work with every disk, so it gets a tighter ceiling.
const clampN = (algoId, n) => (algoId === 'hanoi' ? Math.min(n, 6) : Math.min(n, 10))

function inputFor(algo, state) {
  switch (algo.category) {
    case 'sorting':
      return state.array
    case 'pathfinding':
      return state.grid
    case 'recursion':
      return clampN(algo.id, state.depth)
    case 'tree':
      return state.treeValues
    default:
      return state.array
  }
}

// Run once, keep every frame. Scrubbing is then just an array index.
function compute(algo, state) {
  const t0 = performance.now()
  const frames = algo.run(inputFor(algo, state))
  return { frames, buildMs: performance.now() - t0 }
}

const initialAlgo = byId('bubble')
const base = {
  algoId: initialAlgo.id,
  array: randomArray(24, 12345),
  grid: makeGrid(),
  depth: 7,
  treeValues: makeTreeValues(12, 42),
}
const initial = compute(initialAlgo, base)

export const useTrace = create((set, get) => ({
  ...base,
  frames: initial.frames,
  buildMs: initial.buildMs,
  index: 0,
  playing: false,
  speed: 8,
  cinematic: true,

  rebuild: (patch = {}) => {
    const state = { ...get(), ...patch }
    const algo = byId(state.algoId)
    const { frames, buildMs } = compute(algo, state)
    set({ ...patch, frames, buildMs, index: 0, playing: false })
  },

  selectAlgo: (algoId) => get().rebuild({ algoId }),
  shuffle: () => get().rebuild({ array: randomArray(get().array.length) }),
  resize: (n) => get().rebuild({ array: randomArray(n) }),
  regenerateGrid: () => get().rebuild({ grid: makeGrid(24, 16, Math.floor(Math.random() * 1000)) }),
  setDepth: (depth) => get().rebuild({ depth }),
  regenerateTree: (count = 12) =>
    get().rebuild({ treeValues: makeTreeValues(count, Math.floor(Math.random() * 100000)) }),

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  toggle: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  toggleCinematic: () => set((s) => ({ cinematic: !s.cinematic })),
  seek: (index) =>
    set((s) => ({ index: Math.max(0, Math.min(s.frames.length - 1, index)), playing: false })),
  stepForward: () =>
    set((s) => ({ index: Math.min(s.frames.length - 1, s.index + 1), playing: false })),
  stepBack: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: false })),
  restart: () => set({ index: 0, playing: false }),
  advance: () =>
    set((s) => (s.index >= s.frames.length - 1 ? { playing: false } : { index: s.index + 1 })),
}))
