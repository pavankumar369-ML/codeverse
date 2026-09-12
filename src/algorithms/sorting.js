// Instrumented sorting algorithms.
// Each `run(input)` returns a full trace: an array of immutable frames.
// A frame is everything the 3D scene needs to draw one moment in time.

function makeFrame(a, sorted, counters, line, note, extra = {}) {
  return {
    array: [...a],
    sorted: [...sorted],
    compare: null,
    swap: null,
    pivot: null,
    line,
    note,
    counters: { ...counters },
    ...extra,
  };
}

/* ----------------------------- bubble sort ----------------------------- */

const bubbleCode = `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}`;

function bubbleRun(input) {
  const a = [...input];
  const frames = [];
  const counters = { comparisons: 0, swaps: 0 };
  const sorted = [];

  frames.push(makeFrame(a, sorted, counters, 1, 'Start with the unsorted array.'));

  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      counters.comparisons++;
      frames.push(
        makeFrame(a, sorted, counters, 5, `Compare ${a[j]} and ${a[j + 1]}.`, {
          compare: [j, j + 1],
        })
      );
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        counters.swaps++;
        swapped = true;
        frames.push(
          makeFrame(a, sorted, counters, 6, `${a[j + 1]} is bigger, so swap.`, {
            swap: [j, j + 1],
          })
        );
      }
    }
    sorted.unshift(a.length - 1 - i);
    frames.push(
      makeFrame(a, sorted, counters, 10, `${a[a.length - 1 - i]} is now in its final place.`)
    );
    if (!swapped) break;
  }
  for (let k = 0; k < a.length; k++) if (!sorted.includes(k)) sorted.push(k);
  frames.push(makeFrame(a, sorted, counters, 12, 'Sorted.'));
  return frames;
}

/* ---------------------------- selection sort --------------------------- */

const selectionCode = `function selectionSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) [a[i], a[min]] = [a[min], a[i]];
  }
  return a;
}`;

function selectionRun(input) {
  const a = [...input];
  const frames = [];
  const counters = { comparisons: 0, swaps: 0 };
  const sorted = [];

  frames.push(makeFrame(a, sorted, counters, 1, 'Start with the unsorted array.'));

  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    frames.push(
      makeFrame(a, sorted, counters, 3, `Assume ${a[i]} is the smallest of what is left.`, {
        pivot: i,
      })
    );
    for (let j = i + 1; j < a.length; j++) {
      counters.comparisons++;
      frames.push(
        makeFrame(a, sorted, counters, 5, `Compare ${a[j]} against the current minimum ${a[min]}.`, {
          compare: [j, min],
          pivot: min,
        })
      );
      if (a[j] < a[min]) {
        min = j;
        frames.push(
          makeFrame(a, sorted, counters, 5, `${a[j]} is smaller — new minimum.`, { pivot: min })
        );
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      counters.swaps++;
      frames.push(
        makeFrame(a, sorted, counters, 7, `Move the minimum into position ${i}.`, {
          swap: [i, min],
        })
      );
    }
    sorted.push(i);
    frames.push(makeFrame(a, sorted, counters, 7, `Position ${i} is final.`));
  }
  sorted.push(a.length - 1);
  frames.push(makeFrame(a, sorted, counters, 9, 'Sorted.'));
  return frames;
}

/* ---------------------------- insertion sort --------------------------- */

const insertionCode = `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}`;

function insertionRun(input) {
  const a = [...input];
  const frames = [];
  const counters = { comparisons: 0, shifts: 0 };
  const sorted = [0];

  frames.push(makeFrame(a, sorted, counters, 1, 'The first element counts as a sorted run of one.'));

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push(makeFrame(a, sorted, counters, 3, `Lift ${key} out and find where it belongs.`, { pivot: i }));
    while (j >= 0 && a[j] > key) {
      counters.comparisons++;
      frames.push(
        makeFrame(a, sorted, counters, 5, `${a[j]} is greater than ${key}, shift it right.`, {
          compare: [j, j + 1],
          pivot: i,
        })
      );
      a[j + 1] = a[j];
      counters.shifts++;
      j--;
      frames.push(makeFrame(a, sorted, counters, 6, 'Shifted.', { pivot: i }));
    }
    if (j >= 0) counters.comparisons++;
    a[j + 1] = key;
    sorted.push(i);
    sorted.sort((x, y) => x - y);
    frames.push(makeFrame(a, sorted, counters, 9, `Drop ${key} into position ${j + 1}.`, { pivot: j + 1 }));
  }
  frames.push(makeFrame(a, sorted, counters, 11, 'Sorted.'));
  return frames;
}

/* ------------------------------ quick sort ----------------------------- */

const quickCode = `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {
      [a[i], a[j]] = [a[j], a[i]];
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  quickSort(a, lo, i - 1);
  quickSort(a, i + 1, hi);
  return a;
}`;

function quickRun(input) {
  const a = [...input];
  const frames = [];
  const counters = { comparisons: 0, swaps: 0, partitions: 0 };
  const sorted = [];

  frames.push(makeFrame(a, sorted, counters, 1, 'Start with the unsorted array.'));

  function part(lo, hi) {
    const pivotVal = a[hi];
    counters.partitions++;
    frames.push(
      makeFrame(a, sorted, counters, 3, `Partition [${lo}..${hi}] around pivot ${pivotVal}.`, {
        pivot: hi,
      })
    );
    let i = lo;
    for (let j = lo; j < hi; j++) {
      counters.comparisons++;
      frames.push(
        makeFrame(a, sorted, counters, 6, `Is ${a[j]} smaller than the pivot ${pivotVal}?`, {
          compare: [j, hi],
          pivot: hi,
        })
      );
      if (a[j] < pivotVal) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          counters.swaps++;
          frames.push(
            makeFrame(a, sorted, counters, 7, 'Smaller — move it to the left side.', {
              swap: [i, j],
              pivot: hi,
            })
          );
        }
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    counters.swaps++;
    frames.push(
      makeFrame(a, sorted, counters, 11, `Drop the pivot into position ${i}.`, {
        swap: [i, hi],
        pivot: i,
      })
    );
    sorted.push(i);
    return i;
  }

  function qs(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) {
      sorted.push(lo);
      frames.push(makeFrame(a, sorted, counters, 2, `Single element at ${lo} is already in place.`));
      return;
    }
    const p = part(lo, hi);
    qs(lo, p - 1);
    qs(p + 1, hi);
  }

  qs(0, a.length - 1);
  frames.push(makeFrame(a, sorted, counters, 15, 'Sorted.'));
  return frames;
}

/* ------------------------------ merge sort ----------------------------- */

const mergeCode = `function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const mid = (lo + hi) >> 1;
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  const merged = [];
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi) {
    merged.push(a[i] <= a[j] ? a[i++] : a[j++]);
  }
  while (i <= mid) merged.push(a[i++]);
  while (j <= hi) merged.push(a[j++]);
  for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
  return a;
}`;

function mergeRun(input) {
  const a = [...input];
  const frames = [];
  const counters = { comparisons: 0, writes: 0 };
  const sorted = [];

  frames.push(makeFrame(a, sorted, counters, 1, 'Start with the unsorted array.'));

  function ms(lo, hi) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    frames.push(makeFrame(a, sorted, counters, 3, `Split [${lo}..${hi}] at ${mid}.`, { pivot: mid }));
    ms(lo, mid);
    ms(mid + 1, hi);

    const merged = [];
    let i = lo;
    let j = mid + 1;
    while (i <= mid && j <= hi) {
      counters.comparisons++;
      frames.push(
        makeFrame(a, sorted, counters, 9, `Merge: compare ${a[i]} and ${a[j]}.`, { compare: [i, j] })
      );
      merged.push(a[i] <= a[j] ? a[i++] : a[j++]);
    }
    while (i <= mid) merged.push(a[i++]);
    while (j <= hi) merged.push(a[j++]);
    for (let k = 0; k < merged.length; k++) {
      a[lo + k] = merged[k];
      counters.writes++;
    }
    frames.push(
      makeFrame(a, sorted, counters, 14, `[${lo}..${hi}] is now a sorted run.`, {
        pivot: null,
      })
    );
  }

  ms(0, a.length - 1);
  for (let k = 0; k < a.length; k++) sorted.push(k);
  frames.push(makeFrame(a, sorted, counters, 16, 'Sorted.'));
  return frames;
}

/* -------------------------------- export ------------------------------- */

export const sortingAlgorithms = [
  {
    id: 'bubble',
    name: 'Bubble sort',
    category: 'sorting',
    bigO: { time: 'O(n²)', best: 'O(n)', space: 'O(1)' },
    code: bubbleCode,
    run: bubbleRun,
  },
  {
    id: 'selection',
    name: 'Selection sort',
    category: 'sorting',
    bigO: { time: 'O(n²)', best: 'O(n²)', space: 'O(1)' },
    code: selectionCode,
    run: selectionRun,
  },
  {
    id: 'insertion',
    name: 'Insertion sort',
    category: 'sorting',
    bigO: { time: 'O(n²)', best: 'O(n)', space: 'O(1)' },
    code: insertionCode,
    run: insertionRun,
  },
  {
    id: 'quick',
    name: 'Quick sort',
    category: 'sorting',
    bigO: { time: 'O(n log n)', best: 'O(n log n)', space: 'O(log n)' },
    code: quickCode,
    run: quickRun,
  },
  {
    id: 'merge',
    name: 'Merge sort',
    category: 'sorting',
    bigO: { time: 'O(n log n)', best: 'O(n log n)', space: 'O(n)' },
    code: mergeCode,
    run: mergeRun,
  },
];
