// Instrumented grid pathfinding. The trace format is shared by all four:
//   { visited:[ids], frontier:[ids], current:id, path:[ids], line, note, counters }
// `grid` = { cols, rows, walls:Set-like array, weights:number[], start:id, goal:id }

const idOf = (grid, r, c) => r * grid.cols + c;
const rcOf = (grid, id) => [Math.floor(id / grid.cols), id % grid.cols];

function neighbours(grid, id) {
  const [r, c] = rcOf(grid, id);
  const out = [];
  const deltas = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];
  for (const [dr, dc] of deltas) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= grid.rows || nc >= grid.cols) continue;
    const nid = idOf(grid, nr, nc);
    if (grid.walls[nid]) continue;
    out.push(nid);
  }
  return out;
}

function buildPath(cameFrom, goal, start) {
  const path = [];
  let cur = goal;
  while (cur !== undefined && cur !== null) {
    path.push(cur);
    if (cur === start) break;
    cur = cameFrom[cur];
  }
  return path.reverse();
}

function frame(visited, frontier, current, path, line, note, counters) {
  return {
    visited: [...visited],
    frontier: [...frontier],
    current,
    path: [...path],
    line,
    note,
    counters: { ...counters },
  };
}

function manhattan(grid, a, b) {
  const [ar, ac] = rcOf(grid, a);
  const [br, bc] = rcOf(grid, b);
  return Math.abs(ar - br) + Math.abs(ac - bc);
}

/* --------------------------------- BFS --------------------------------- */

const bfsCode = `function bfs(start, goal) {
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const node = queue.shift();
    if (node === goal) return reconstruct(node);
    for (const next of neighbours(node)) {
      if (seen.has(next)) continue;
      seen.add(next);
      cameFrom[next] = node;
      queue.push(next);
    }
  }
  return null;
}`;

function bfsRun(grid) {
  const frames = [];
  const counters = { visited: 0, pushed: 1, pathCost: 0 };
  const queue = [grid.start];
  const seen = new Set([grid.start]);
  const cameFrom = {};
  const visited = [];

  frames.push(frame(visited, queue, grid.start, [], 2, 'Queue holds just the start cell.', counters));

  while (queue.length) {
    const node = queue.shift();
    visited.push(node);
    counters.visited++;
    frames.push(frame(visited, queue, node, [], 5, 'Take the oldest cell off the queue.', counters));

    if (node === grid.goal) {
      const path = buildPath(cameFrom, grid.goal, grid.start);
      counters.pathCost = path.length - 1;
      frames.push(frame(visited, queue, node, path, 6, `Goal reached in ${path.length - 1} steps.`, counters));
      return frames;
    }
    for (const next of neighbours(grid, node)) {
      if (seen.has(next)) continue;
      seen.add(next);
      cameFrom[next] = node;
      queue.push(next);
      counters.pushed++;
    }
    frames.push(frame(visited, queue, node, [], 12, 'Every new neighbour joins the back of the queue.', counters));
  }
  frames.push(frame(visited, [], null, [], 15, 'No path exists.', counters));
  return frames;
}

/* --------------------------------- DFS --------------------------------- */

const dfsCode = `function dfs(start, goal) {
  const stack = [start];
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    if (node === goal) return reconstruct(node);
    for (const next of neighbours(node)) {
      if (seen.has(next)) continue;
      cameFrom[next] = node;
      stack.push(next);
    }
  }
  return null;
}`;

function dfsRun(grid) {
  const frames = [];
  const counters = { visited: 0, pushed: 1, pathCost: 0 };
  const stack = [grid.start];
  const seen = new Set();
  const cameFrom = {};
  const visited = [];

  frames.push(frame(visited, stack, grid.start, [], 2, 'Stack holds just the start cell.', counters));

  while (stack.length) {
    const node = stack.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    visited.push(node);
    counters.visited++;
    frames.push(frame(visited, stack, node, [], 5, 'Take the newest cell off the stack.', counters));

    if (node === grid.goal) {
      const path = buildPath(cameFrom, grid.goal, grid.start);
      counters.pathCost = path.length - 1;
      frames.push(frame(visited, stack, node, path, 7, `Goal reached after ${path.length - 1} steps — not necessarily the shortest.`, counters));
      return frames;
    }
    for (const next of neighbours(grid, node)) {
      if (seen.has(next)) continue;
      cameFrom[next] = node;
      stack.push(next);
      counters.pushed++;
    }
    frames.push(frame(visited, stack, node, [], 12, 'Neighbours go on top, so the search dives deep before it spreads.', counters));
  }
  frames.push(frame(visited, [], null, [], 15, 'No path exists.', counters));
  return frames;
}

/* ------------------------------- Dijkstra ------------------------------ */

const dijkstraCode = `function dijkstra(start, goal) {
  const dist = { [start]: 0 };
  const pq = [[0, start]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, node] = pq.shift();
    if (node === goal) return reconstruct(node);
    for (const next of neighbours(node)) {
      const nd = d + weight(next);
      if (nd < (dist[next] ?? Infinity)) {
        dist[next] = nd;
        cameFrom[next] = node;
        pq.push([nd, next]);
      }
    }
  }
  return null;
}`;

function dijkstraRun(grid) {
  const frames = [];
  const counters = { visited: 0, relaxed: 0, pathCost: 0 };
  const dist = { [grid.start]: 0 };
  const pq = [[0, grid.start]];
  const done = new Set();
  const cameFrom = {};
  const visited = [];

  frames.push(frame(visited, [grid.start], grid.start, [], 3, 'Start cell has distance 0. Everything else is unknown.', counters));

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, node] = pq.shift();
    if (done.has(node)) continue;
    done.add(node);
    visited.push(node);
    counters.visited++;
    frames.push(
      frame(visited, pq.map((p) => p[1]), node, [], 6, `Settle the closest unvisited cell (cost ${d}).`, counters)
    );

    if (node === grid.goal) {
      const path = buildPath(cameFrom, grid.goal, grid.start);
      counters.pathCost = d;
      frames.push(frame(visited, pq.map((p) => p[1]), node, path, 7, `Cheapest route costs ${d}.`, counters));
      return frames;
    }
    for (const next of neighbours(grid, node)) {
      const nd = d + grid.weights[next];
      if (nd < (dist[next] ?? Infinity)) {
        dist[next] = nd;
        cameFrom[next] = node;
        pq.push([nd, next]);
        counters.relaxed++;
      }
    }
    frames.push(
      frame(visited, pq.map((p) => p[1]), node, [], 12, 'Relax each neighbour: keep the cheaper of the old and new cost.', counters)
    );
  }
  frames.push(frame(visited, [], null, [], 17, 'No path exists.', counters));
  return frames;
}

/* ---------------------------------- A* --------------------------------- */

const astarCode = `function aStar(start, goal) {
  const g = { [start]: 0 };
  const open = [[heuristic(start, goal), start]];
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, node] = open.shift();
    if (node === goal) return reconstruct(node);
    for (const next of neighbours(node)) {
      const ng = g[node] + weight(next);
      if (ng < (g[next] ?? Infinity)) {
        g[next] = ng;
        cameFrom[next] = node;
        open.push([ng + heuristic(next, goal), next]);
      }
    }
  }
  return null;
}`;

function astarRun(grid) {
  const frames = [];
  const counters = { visited: 0, relaxed: 0, pathCost: 0 };
  const g = { [grid.start]: 0 };
  const open = [[manhattan(grid, grid.start, grid.goal), grid.start]];
  const done = new Set();
  const cameFrom = {};
  const visited = [];

  frames.push(
    frame(visited, [grid.start], grid.start, [], 3, 'Same as Dijkstra, but each cell also carries a guess of the distance left.', counters)
  );

  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, node] = open.shift();
    if (done.has(node)) continue;
    done.add(node);
    visited.push(node);
    counters.visited++;
    frames.push(
      frame(visited, open.map((p) => p[1]), node, [], 6, 'Expand the cell with the best cost-so-far plus guess.', counters)
    );

    if (node === grid.goal) {
      const path = buildPath(cameFrom, grid.goal, grid.start);
      counters.pathCost = g[node];
      frames.push(frame(visited, open.map((p) => p[1]), node, path, 7, `Goal reached at cost ${g[node]} — and far fewer cells were opened.`, counters));
      return frames;
    }
    for (const next of neighbours(grid, node)) {
      const ng = g[node] + grid.weights[next];
      if (ng < (g[next] ?? Infinity)) {
        g[next] = ng;
        cameFrom[next] = node;
        open.push([ng + manhattan(grid, next, grid.goal), next]);
        counters.relaxed++;
      }
    }
    frames.push(
      frame(visited, open.map((p) => p[1]), node, [], 12, 'The guess pulls the search towards the goal instead of spreading evenly.', counters)
    );
  }
  frames.push(frame(visited, [], null, [], 17, 'No path exists.', counters));
  return frames;
}

/* -------------------------------- export ------------------------------- */

export const pathfindingAlgorithms = [
  {
    id: 'bfs',
    name: 'Breadth-first search',
    category: 'pathfinding',
    bigO: { time: 'O(V + E)', best: 'O(V + E)', space: 'O(V)' },
    code: bfsCode,
    run: bfsRun,
  },
  {
    id: 'dfs',
    name: 'Depth-first search',
    category: 'pathfinding',
    bigO: { time: 'O(V + E)', best: 'O(V + E)', space: 'O(V)' },
    code: dfsCode,
    run: dfsRun,
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's algorithm",
    category: 'pathfinding',
    bigO: { time: 'O(E log V)', best: 'O(E log V)', space: 'O(V)' },
    code: dijkstraCode,
    run: dijkstraRun,
  },
  {
    id: 'astar',
    name: 'A* search',
    category: 'pathfinding',
    bigO: { time: 'O(E log V)', best: 'O(E)', space: 'O(V)' },
    code: astarCode,
    run: astarRun,
  },
];

export function makeGrid(cols = 24, rows = 16, seed = 7) {
  // Small deterministic PRNG so a given seed always rebuilds the same maze.
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const size = cols * rows;
  const walls = new Array(size).fill(false);
  const weights = new Array(size).fill(1);
  const start = idOf({ cols }, Math.floor(rows / 2), 1);
  const goal = idOf({ cols }, Math.floor(rows / 2), cols - 2);

  for (let i = 0; i < size; i++) {
    if (i === start || i === goal) continue;
    const r = rand();
    if (r < 0.22) walls[i] = true;
    else if (r < 0.34) weights[i] = 5; // slow terrain — this is where Dijkstra earns its keep
  }
  return { cols, rows, walls, weights, start, goal, seed };
}
