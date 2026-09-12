// A run is fully determined by (algorithm, input). Both are small, so the whole
// thing fits in the URL hash — a shareable permalink with no backend at all.

const KEYS = ['a', 'o', 'arr', 'g', 'd', 'tv'];

export function encodeState(state) {
  const payload = {
    a: state.algoId,
    o: state.opponentId || undefined,
    arr: state.array,
    g: state.gridSeed,
    d: state.depth,
    tv: state.treeValues,
  };
  try {
    const json = JSON.stringify(payload, KEYS);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

export function decodeState(hash) {
  if (!hash) return null;
  try {
    const json = decodeURIComponent(escape(atob(hash.replace(/^#/, ''))));
    const p = JSON.parse(json);
    if (!p || typeof p.a !== 'string') return null;
    return {
      algoId: p.a,
      opponentId: p.o ?? null,
      array: Array.isArray(p.arr) ? p.arr : undefined,
      gridSeed: typeof p.g === 'number' ? p.g : undefined,
      depth: typeof p.d === 'number' ? p.d : undefined,
      treeValues: Array.isArray(p.tv) ? p.tv : undefined,
    };
  } catch {
    return null;
  }
}

export function readHash() {
  if (typeof window === 'undefined') return null;
  return decodeState(window.location.hash);
}

export function writeHash(state) {
  if (typeof window === 'undefined') return;
  const encoded = encodeState(state);
  if (!encoded) return;
  // replaceState keeps the back button useful instead of logging every tweak.
  window.history.replaceState(null, '', `#${encoded}`);
}

export function currentLink(state) {
  const encoded = encodeState(state);
  return `${window.location.origin}${window.location.pathname}#${encoded}`;
}
