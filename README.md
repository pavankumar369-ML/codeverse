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

**Race mode.** Pick a rival in the same category and both run on the same input in
two lanes, with a live counter table. Comparable counters only — matching "swaps"
against "shifts" would be a meaningless comparison, so the table intersects the two
counter sets.

**Shareable links.** A run is fully determined by (algorithm, input), and both are
small, so the whole thing is base64'd into the URL hash. No backend, no database,
and a link keeps working on GitHub Pages. See `src/lib/permalink.js`.

Next: user-written algorithms via a sandboxed runtime, GIF export, linked lists
and heaps.
