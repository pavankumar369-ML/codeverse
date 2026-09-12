import { create } from 'zustand'
import { byId, makeGrid, makeTreeValues } from '../algorithms/index.js'
import { readHash, writeHash } from '../lib/permalink.js'

function randomArray(n, seed = Date.now()) {
  let s = Math.abs(seed) % 233280
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: n }, () => 5 + Math.floor(rand() * 95))
}

// Hanoi doubles its work with every disk, so it gets a tighter ceiling.
const MAX_N = { hanoi: 6, permutations: 5 }
const clampN = (algoId, n) => Math.min(n, MAX_N[algoId] ?? 10)

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

const shared = readHash() ?? {}
const base = {
  algoId: byId(shared.algoId ?? 'bubble').id,
  opponentId: shared.opponentId ?? null,
  array: shared.array ?? randomArray(24, 12345),
  gridSeed: shared.gridSeed ?? 7,
  depth: shared.depth ?? 7,
  treeValues: shared.treeValues ?? makeTreeValues(12, 42),
}
base.grid = makeGrid(24, 16, base.gridSeed)

const initialAlgo = byId(base.algoId)
const initial = compute(initialAlgo, base)
const initialB =
  base.opponentId && byId(base.opponentId).category === initialAlgo.category
    ? compute(byId(base.opponentId), base)
    : { frames: null, buildMs: 0 }

export const useTrace = create((set, get) => ({
  ...base,
  frames: initial.frames,
  buildMs: initial.buildMs,
  framesB: initialB.frames,
  index: 0,
  playing: false,
  speed: 8,
  cinematic: true,

  rebuild: (patch = {}) => {
    const state = { ...get(), ...patch }
    if (patch.gridSeed !== undefined) state.grid = makeGrid(24, 16, patch.gridSeed)
    const algo = byId(state.algoId)

    // An opponent only makes sense inside the same category — a sorting run and
    // a tree walk have nothing comparable to put side by side.
    let opponentId = state.opponentId
    if (opponentId && byId(opponentId).category !== algo.category) opponentId = null

    const { frames, buildMs } = compute(algo, state)
    const framesB = opponentId ? compute(byId(opponentId), state).frames : null

    const next = { ...patch, opponentId, frames, framesB, buildMs, index: 0, playing: false }
    if (patch.gridSeed !== undefined) next.grid = state.grid
    set(next)
    writeHash({ ...state, ...next })
  },

  selectAlgo: (algoId) => get().rebuild({ algoId }),
  setOpponent: (opponentId) => get().rebuild({ opponentId }),
  clearOpponent: () => get().rebuild({ opponentId: null }),
  shuffle: () => get().rebuild({ array: randomArray(get().array.length) }),
  resize: (n) => get().rebuild({ array: randomArray(n) }),
  regenerateGrid: () => get().rebuild({ gridSeed: Math.floor(Math.random() * 100000) }),
  setDepth: (depth) => get().rebuild({ depth }),
  regenerateTree: (count = 12) =>
    get().rebuild({ treeValues: makeTreeValues(count, Math.floor(Math.random() * 100000)) }),

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  toggle: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  toggleCinematic: () => set((s) => ({ cinematic: !s.cinematic })),

  // In race mode the timeline runs as long as the slower of the two.
  total: () => {
    const s = get()
    return Math.max(s.frames.length, s.framesB ? s.framesB.length : 0)
  },

  seek: (index) =>
    set((s) => ({
      index: Math.max(0, Math.min(get().total() - 1, index)),
      playing: false,
    })),
  stepForward: () =>
    set((s) => ({ index: Math.min(get().total() - 1, s.index + 1), playing: false })),
  stepBack: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: false })),
  restart: () => set({ index: 0, playing: false }),
  advance: () =>
    set((s) => (s.index >= get().total() - 1 ? { playing: false } : { index: s.index + 1 })),
}))

// Frame lookup that holds on the last frame once a side has finished.
export const frameAt = (frames, index) =>
  frames ? frames[Math.min(index, frames.length - 1)] : null
