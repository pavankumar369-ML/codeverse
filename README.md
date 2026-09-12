# Codeverse 3D

A live, navigable 3D visualizer for algorithms and data structures. Run the algorithm
once, capture every state change as a frame, then scrub through the run like video.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173

## How it works

The core idea is the **trace model**. Each algorithm in `src/algorithms/` is instrumented:
instead of just returning a result, it pushes a frame every time something interesting
happens. A frame is a complete snapshot of the visual state, plus the source line that
produced it and a plain-English note.

Because the whole trace is built up front (`src/store/useTrace.js`), stepping backwards
costs the same as stepping forwards — nothing is re-executed. The 3D scenes are pure
functions of `frames[index]`.

```
algorithms/  instrumented implementations -> frame[]
store/       trace + playback state (zustand)
scenes/      react-three-fiber scenes, driven by the current frame
components/  editor, controls, stats panel
```

## Controls

| Key | Action |
| --- | --- |
| Space | play / pause |
| → ← | step forward / back |
| R | restart |

Drag on the canvas to orbit, scroll to zoom.

## Status

**13 algorithms across four scenes.**

| Category | Algorithms | Scene |
| --- | --- | --- |
| Sorting | bubble, selection, insertion, quick, merge | orbitable bars, labelled |
| Pathfinding | BFS, DFS, Dijkstra, A* | instanced grid, wavefront spread |
| Recursion | fibonacci, memoized fibonacci, Hanoi, permutations | call-stack tower (+ live pegs for Hanoi) |
| Trees | BST insert, BST search, in-order, level-order | 3D node graph with animated edges |

Also done: playback scrubbing, live counters, code highlighting synced to the current
frame, per-scene camera framing with an eased transition, bloom and vignette, idle
auto-orbit, floating caption and colour legend.

Next: race mode (two algorithms, one input, side by side), shareable permalinks
(FastAPI + SQLite), user-written algorithms via a sandboxed runtime, GIF export.
