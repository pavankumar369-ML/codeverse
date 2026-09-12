// Recursion traces. The visual is the call stack itself: every frame carries the
// full stack as it stood at that moment, so the 3D tower grows and shrinks.
//
// Frame: { stack:[{key,label,depth,status}], note, line, counters, result }
// status: 'calling' | 'waiting' | 'returning' | 'memo'

function snapshot(stack, counters, line, note, extra = {}) {
  return {
    stack: stack.map((f) => ({ ...f })),
    line,
    note,
    counters: { ...counters },
    result: null,
    ...extra,
  };
}

/* ------------------------------- fibonacci ------------------------------ */

const fibCode = `function fib(n) {
  if (n <= 1) return n;
  const left = fib(n - 1);
  const right = fib(n - 2);
  return left + right;
}`;

function fibRun(n) {
  const frames = [];
  const counters = { calls: 0, depth: 0, maxDepth: 0, baseCases: 0 };
  const stack = [];
  let key = 0;

  function fib(v) {
    const f = { key: key++, label: `fib(${v})`, depth: stack.length, status: 'calling', value: null };
    stack.push(f);
    counters.calls++;
    counters.depth = stack.length;
    counters.maxDepth = Math.max(counters.maxDepth, stack.length);
    frames.push(snapshot(stack, counters, 1, `Call fib(${v}). The stack is ${stack.length} deep.`));

    if (v <= 1) {
      counters.baseCases++;
      f.status = 'returning';
      f.value = v;
      frames.push(snapshot(stack, counters, 2, `fib(${v}) is a base case — return ${v} immediately.`));
      stack.pop();
      counters.depth = stack.length;
      return v;
    }

    f.status = 'waiting';
    frames.push(snapshot(stack, counters, 3, `fib(${v}) must wait for fib(${v - 1}).`));
    const left = fib(v - 1);

    frames.push(snapshot(stack, counters, 4, `fib(${v - 1}) came back as ${left}. Now ask for fib(${v - 2}).`));
    const right = fib(v - 2);

    f.status = 'returning';
    f.value = left + right;
    frames.push(
      snapshot(stack, counters, 5, `fib(${v}) returns ${left} + ${right} = ${left + right}.`)
    );
    stack.pop();
    counters.depth = stack.length;
    return left + right;
  }

  const result = fib(n);
  frames.push(snapshot(stack, counters, 5, `fib(${n}) = ${result}, after ${counters.calls} calls.`, { result }));
  return frames;
}

/* --------------------------- memoized fibonacci -------------------------- */

const fibMemoCode = `function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`;

function fibMemoRun(n) {
  const frames = [];
  const counters = { calls: 0, depth: 0, maxDepth: 0, cacheHits: 0 };
  const stack = [];
  const memo = {};
  let key = 0;

  function fib(v) {
    const f = { key: key++, label: `fib(${v})`, depth: stack.length, status: 'calling', value: null };
    stack.push(f);
    counters.calls++;
    counters.depth = stack.length;
    counters.maxDepth = Math.max(counters.maxDepth, stack.length);
    frames.push(snapshot(stack, counters, 1, `Call fib(${v}).`));

    if (v in memo) {
      counters.cacheHits++;
      f.status = 'memo';
      f.value = memo[v];
      frames.push(snapshot(stack, counters, 2, `fib(${v}) is already in the cache — return ${memo[v]} without recursing.`));
      stack.pop();
      counters.depth = stack.length;
      return memo[v];
    }
    if (v <= 1) {
      f.status = 'returning';
      f.value = v;
      frames.push(snapshot(stack, counters, 3, `Base case: return ${v}.`));
      stack.pop();
      counters.depth = stack.length;
      return v;
    }

    f.status = 'waiting';
    const left = fib(v - 1);
    const right = fib(v - 2);
    memo[v] = left + right;
    f.status = 'returning';
    f.value = memo[v];
    frames.push(snapshot(stack, counters, 4, `Store fib(${v}) = ${memo[v]} in the cache and return it.`));
    stack.pop();
    counters.depth = stack.length;
    return memo[v];
  }

  const result = fib(n);
  frames.push(
    snapshot(stack, counters, 5, `fib(${n}) = ${result} in ${counters.calls} calls — the cache absorbed ${counters.cacheHits} of them.`, { result })
  );
  return frames;
}

/* ------------------------------ tower of hanoi --------------------------- */

const hanoiCode = `function hanoi(n, from, to, via) {
  if (n === 0) return;
  hanoi(n - 1, from, via, to);
  move(n, from, to);
  hanoi(n - 1, via, to, from);
}`;

function hanoiRun(n) {
  const frames = [];
  const counters = { calls: 0, moves: 0, depth: 0, maxDepth: 0 };
  const stack = [];
  const pegs = { A: [], B: [], C: [] };
  for (let d = n; d >= 1; d--) pegs.A.push(d);
  let key = 0;

  const withPegs = (line, note, extra) =>
    snapshot(stack, counters, line, note, {
      pegs: { A: [...pegs.A], B: [...pegs.B], C: [...pegs.C] },
      ...extra,
    });

  function hanoi(d, from, to, via) {
    const f = {
      key: key++,
      label: `hanoi(${d}, ${from}→${to})`,
      depth: stack.length,
      status: 'calling',
      value: null,
    };
    stack.push(f);
    counters.calls++;
    counters.depth = stack.length;
    counters.maxDepth = Math.max(counters.maxDepth, stack.length);
    frames.push(withPegs(1, `Move ${d} disks from ${from} to ${to}, using ${via} as the spare.`));

    if (d === 0) {
      f.status = 'returning';
      frames.push(withPegs(2, 'Nothing left to move — return.'));
      stack.pop();
      counters.depth = stack.length;
      return;
    }

    f.status = 'waiting';
    hanoi(d - 1, from, via, to);

    const disk = pegs[from].pop();
    pegs[to].push(disk);
    counters.moves++;
    f.status = 'calling';
    frames.push(withPegs(4, `Move disk ${disk} from ${from} to ${to}. That is move ${counters.moves}.`));

    f.status = 'waiting';
    hanoi(d - 1, via, to, from);

    f.status = 'returning';
    frames.push(withPegs(5, `The ${d}-disk job from ${from} to ${to} is done.`));
    stack.pop();
    counters.depth = stack.length;
  }

  hanoi(n, 'A', 'B', 'C');
  frames.push(withPegs(5, `Solved in ${counters.moves} moves — the theoretical minimum is ${2 ** n - 1}.`, { result: counters.moves }));
  return frames;
}

/* -------------------------------- permutations --------------------------- */

const permCode = `function permute(chars, current = []) {
  if (chars.length === 0) {
    output.push(current.join(''));
    return;
  }
  for (let i = 0; i < chars.length; i++) {
    const rest = chars.filter((_, j) => j !== i);
    permute(rest, [...current, chars[i]]);
  }
}`;

function permRun(n) {
  const letters = 'ABCDE'.slice(0, Math.max(2, Math.min(5, n)));
  const frames = [];
  const counters = { calls: 0, depth: 0, maxDepth: 0, found: 0 };
  const stack = [];
  const output = [];
  let key = 0;

  function permute(chars, current) {
    const f = {
      key: key++,
      label: current.length ? current.join('') + '|' + chars.join('') : chars.join(''),
      depth: stack.length,
      status: 'calling',
      value: null,
    };
    stack.push(f);
    counters.calls++;
    counters.depth = stack.length;
    counters.maxDepth = Math.max(counters.maxDepth, stack.length);
    frames.push(snapshot(stack, counters, 1, `Fixed so far: ${current.join('') || '(nothing)'}. Still free: ${chars.join('') || '(none)'}.`, { output: [...output] }));

    if (chars.length === 0) {
      output.push(current.join(''));
      counters.found++;
      f.status = 'returning';
      f.value = current.join('');
      frames.push(snapshot(stack, counters, 3, `Nothing left to place — record ${current.join('')}.`, { output: [...output] }));
      stack.pop();
      counters.depth = stack.length;
      return;
    }

    f.status = 'waiting';
    for (let i = 0; i < chars.length; i++) {
      const rest = chars.filter((_, j) => j !== i);
      frames.push(snapshot(stack, counters, 6, `Try ${chars[i]} in position ${current.length + 1}.`, { output: [...output] }));
      permute(rest, [...current, chars[i]]);
    }
    f.status = 'returning';
    frames.push(snapshot(stack, counters, 8, `Every choice at this level has been tried — backtrack.`, { output: [...output] }));
    stack.pop();
    counters.depth = stack.length;
  }

  permute(letters.split(''), []);
  frames.push(
    snapshot(stack, counters, 9, `${counters.found} permutations of ${letters}, which is ${letters.length}! as expected.`, {
      output: [...output],
      result: counters.found,
    })
  );
  return frames;
}

export const recursionAlgorithms = [
  {
    id: 'fib',
    name: 'Fibonacci',
    category: 'recursion',
    bigO: { time: 'O(2ⁿ)', best: 'O(2ⁿ)', space: 'O(n)' },
    code: fibCode,
    run: fibRun,
  },
  {
    id: 'fib-memo',
    name: 'Fibonacci, memoized',
    category: 'recursion',
    bigO: { time: 'O(n)', best: 'O(n)', space: 'O(n)' },
    code: fibMemoCode,
    run: fibMemoRun,
  },
  {
    id: 'hanoi',
    name: 'Tower of Hanoi',
    category: 'recursion',
    bigO: { time: 'O(2ⁿ)', best: 'O(2ⁿ)', space: 'O(n)' },
    code: hanoiCode,
    run: hanoiRun,
  },
  {
    id: 'permutations',
    name: 'Permutations',
    category: 'recursion',
    bigO: { time: 'O(n·n!)', best: 'O(n·n!)', space: 'O(n)' },
    code: permCode,
    run: permRun,
  },
];
