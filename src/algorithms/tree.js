// Binary search tree traces.
//
// The layout is computed once against the FINAL tree, so a node never jumps
// around mid-animation — it just fades in when it is inserted.
//
// Frame: { present:[ids], active, compare:[ids], visited:[ids], edges:[[a,b]],
//          output:[values], note, line, counters }

function buildTree(values) {
  const nodes = [];
  let root = null;

  const make = (value) => {
    const node = { id: nodes.length, value, left: null, right: null, parent: null, depth: 0 };
    nodes.push(node);
    return node;
  };

  for (const value of values) {
    const node = make(value);
    if (root === null) {
      root = node;
      continue;
    }
    let cur = root;
    while (true) {
      if (value < cur.value) {
        if (cur.left === null) {
          cur.left = node.id;
          node.parent = cur.id;
          node.depth = cur.depth + 1;
          break;
        }
        cur = nodes[cur.left];
      } else {
        if (cur.right === null) {
          cur.right = node.id;
          node.parent = cur.id;
          node.depth = cur.depth + 1;
          break;
        }
        cur = nodes[cur.right];
      }
    }
  }

  // in-order index gives each node a horizontal slot with no overlaps
  let slot = 0;
  const assign = (id) => {
    if (id === null) return;
    assign(nodes[id].left);
    nodes[id].x = slot++;
    assign(nodes[id].right);
  };
  assign(root === null ? null : root.id);

  const edges = nodes
    .filter((n) => n.parent !== null)
    .map((n) => [n.parent, n.id]);

  return { nodes, root: root === null ? null : root.id, edges, width: slot };
}

function frameOf(tree, present, counters, line, note, extra = {}) {
  return {
    present: [...present],
    active: null,
    compare: [],
    visited: [],
    output: [],
    line,
    note,
    counters: { ...counters },
    tree,
    ...extra,
  };
}

/* --------------------------------- insert -------------------------------- */

const insertCode = `function insert(root, value) {
  if (root === null) return new Node(value);
  let cur = root;
  while (true) {
    if (value < cur.value) {
      if (!cur.left) { cur.left = new Node(value); return root; }
      cur = cur.left;
    } else {
      if (!cur.right) { cur.right = new Node(value); return root; }
      cur = cur.right;
    }
  }
}`;

function insertRun(values) {
  const tree = buildTree(values);
  const frames = [];
  const counters = { inserted: 0, comparisons: 0, height: 0 };
  const present = [];

  frames.push(frameOf(tree, present, counters, 1, 'An empty tree. Values arrive one at a time.'));

  for (const node of tree.nodes) {
    const walk = [];
    let cur = node.parent;
    while (cur !== null && cur !== undefined) {
      walk.unshift(cur);
      cur = tree.nodes[cur].parent;
    }
    for (const step of walk) {
      counters.comparisons++;
      frames.push(
        frameOf(tree, present, counters, 5, `${node.value} ${node.value < tree.nodes[step].value ? 'is smaller than' : 'is not smaller than'} ${tree.nodes[step].value}, so go ${node.value < tree.nodes[step].value ? 'left' : 'right'}.`, {
          active: step,
          compare: [step],
        })
      );
    }
    present.push(node.id);
    counters.inserted++;
    counters.height = Math.max(counters.height, node.depth + 1);
    frames.push(
      frameOf(tree, present, counters, 6, `Attach ${node.value} at depth ${node.depth}.`, {
        active: node.id,
      })
    );
  }
  frames.push(frameOf(tree, present, counters, 11, `Tree built: ${counters.inserted} nodes, height ${counters.height}.`));
  return frames;
}

/* --------------------------------- search -------------------------------- */

const searchCode = `function search(root, target) {
  let cur = root;
  while (cur !== null) {
    if (target === cur.value) return cur;
    cur = target < cur.value ? cur.left : cur.right;
  }
  return null;
}`;

function searchRun(values) {
  const tree = buildTree(values);
  const present = tree.nodes.map((n) => n.id);
  const frames = [];
  const counters = { comparisons: 0, depthReached: 0 };
  const target = values[Math.floor(values.length * 0.7)];

  frames.push(frameOf(tree, present, counters, 1, `Look for ${target}. Every comparison throws away half the remaining tree.`));

  let cur = tree.root;
  const visited = [];
  while (cur !== null && cur !== undefined) {
    counters.comparisons++;
    counters.depthReached = tree.nodes[cur].depth + 1;
    visited.push(cur);
    const node = tree.nodes[cur];
    if (target === node.value) {
      frames.push(frameOf(tree, present, counters, 3, `Found ${target} after ${counters.comparisons} comparisons.`, { active: cur, visited }));
      return frames;
    }
    const goLeft = target < node.value;
    frames.push(
      frameOf(tree, present, counters, 4, `${target} ${goLeft ? '<' : '>'} ${node.value} — ignore the ${goLeft ? 'right' : 'left'} subtree entirely.`, {
        active: cur,
        visited,
      })
    );
    cur = goLeft ? node.left : node.right;
  }
  frames.push(frameOf(tree, present, counters, 6, `${target} is not in the tree.`, { visited }));
  return frames;
}

/* ------------------------------- traversals ------------------------------ */

const inorderCode = `function inorder(node, out = []) {
  if (node === null) return out;
  inorder(node.left, out);
  out.push(node.value);
  inorder(node.right, out);
  return out;
}`;

function inorderRun(values) {
  const tree = buildTree(values);
  const present = tree.nodes.map((n) => n.id);
  const frames = [];
  const counters = { visits: 0, emitted: 0 };
  const visited = [];
  const output = [];

  frames.push(frameOf(tree, present, counters, 1, 'In-order: left subtree, then the node, then the right subtree.'));

  function go(id) {
    if (id === null || id === undefined) return;
    const node = tree.nodes[id];
    counters.visits++;
    visited.push(id);
    frames.push(frameOf(tree, present, counters, 3, `Descend into ${node.value}'s left subtree first.`, { active: id, visited, output: [...output] }));
    go(node.left);
    output.push(node.value);
    counters.emitted++;
    frames.push(frameOf(tree, present, counters, 4, `Left side is done — emit ${node.value}.`, { active: id, visited, output: [...output] }));
    go(node.right);
  }

  go(tree.root);
  frames.push(
    frameOf(tree, present, counters, 6, `Output: ${output.join(', ')} — in-order on a BST always comes out sorted.`, {
      visited,
      output: [...output],
    })
  );
  return frames;
}

const levelCode = `function levelOrder(root) {
  const out = [], queue = [root];
  while (queue.length) {
    const node = queue.shift();
    out.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return out;
}`;

function levelRun(values) {
  const tree = buildTree(values);
  const present = tree.nodes.map((n) => n.id);
  const frames = [];
  const counters = { visits: 0, queued: 1 };
  const visited = [];
  const output = [];
  const queue = tree.root === null ? [] : [tree.root];

  frames.push(frameOf(tree, present, counters, 2, 'Level order walks the tree in rings, one depth at a time.'));

  while (queue.length) {
    const id = queue.shift();
    const node = tree.nodes[id];
    visited.push(id);
    output.push(node.value);
    counters.visits++;
    frames.push(
      frameOf(tree, present, counters, 4, `Take ${node.value} off the queue at depth ${node.depth}.`, {
        active: id,
        visited,
        compare: [...queue],
        output: [...output],
      })
    );
    if (node.left !== null) {
      queue.push(node.left);
      counters.queued++;
    }
    if (node.right !== null) {
      queue.push(node.right);
      counters.queued++;
    }
  }
  frames.push(frameOf(tree, present, counters, 9, `Output: ${output.join(', ')}.`, { visited, output: [...output] }));
  return frames;
}

export const treeAlgorithms = [
  {
    id: 'bst-insert',
    name: 'BST insert',
    category: 'tree',
    bigO: { time: 'O(h)', best: 'O(log n)', space: 'O(1)' },
    code: insertCode,
    run: insertRun,
  },
  {
    id: 'bst-search',
    name: 'BST search',
    category: 'tree',
    bigO: { time: 'O(h)', best: 'O(log n)', space: 'O(1)' },
    code: searchCode,
    run: searchRun,
  },
  {
    id: 'inorder',
    name: 'In-order traversal',
    category: 'tree',
    bigO: { time: 'O(n)', best: 'O(n)', space: 'O(h)' },
    code: inorderCode,
    run: inorderRun,
  },
  {
    id: 'levelorder',
    name: 'Level-order traversal',
    category: 'tree',
    bigO: { time: 'O(n)', best: 'O(n)', space: 'O(n)' },
    code: levelCode,
    run: levelRun,
  },
];

export function makeTreeValues(count = 12, seed = Date.now()) {
  let s = Math.abs(seed) % 233280;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pool = new Set();
  while (pool.size < count) pool.add(10 + Math.floor(rand() * 89));
  return [...pool];
}
