import { create } from 'zustand';
import { byId, makeGrid } from '../algorithms/index.js';

function randomArray(n, seed = Date.now()) {
  let s = seed % 233280;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, () => 5 + Math.floor(rand() * 95));
}

// The whole point of the trace model: run the algorithm once, keep every frame,
// then scrubbing is just an array index. Nothing is re-executed while you play.
function compute(algo, { array, grid }) {
  const t0 = performance.now();
  const frames = algo.category === 'sorting' ? algo.run(array) : algo.run(grid);
  return { frames, buildMs: performance.now() - t0 };
}

const initialAlgo = byId('bubble');
const initialArray = randomArray(24, 12345);
const initialGrid = makeGrid();
const initial = compute(initialAlgo, { array: initialArray, grid: initialGrid });

export const useTrace = create((set, get) => ({
  algoId: initialAlgo.id,
  array: initialArray,
  grid: initialGrid,
  frames: initial.frames,
  buildMs: initial.buildMs,
  index: 0,
  playing: false,
  speed: 8, // frames per second

  frame: () => get().frames[get().index],
  algo: () => byId(get().algoId),

  rebuild: (patch = {}) => {
    const state = { ...get(), ...patch };
    const algo = byId(state.algoId);
    const { frames, buildMs } = compute(algo, state);
    set({ ...patch, frames, buildMs, index: 0, playing: false });
  },

  selectAlgo: (algoId) => get().rebuild({ algoId }),
  shuffle: () => get().rebuild({ array: randomArray(get().array.length) }),
  resize: (n) => get().rebuild({ array: randomArray(n) }),
  regenerateGrid: () => get().rebuild({ grid: makeGrid(24, 16, Math.floor(Math.random() * 1000)) }),

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  toggle: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  seek: (index) =>
    set((s) => ({ index: Math.max(0, Math.min(s.frames.length - 1, index)), playing: false })),
  stepForward: () =>
    set((s) => ({ index: Math.min(s.frames.length - 1, s.index + 1), playing: false })),
  stepBack: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: false })),
  restart: () => set({ index: 0, playing: false }),

  // called by the animation loop
  advance: () =>
    set((s) => {
      if (s.index >= s.frames.length - 1) return { playing: false };
      return { index: s.index + 1 };
    }),
}));
