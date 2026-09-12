import { useEffect, useRef } from 'react';
import { useTrace } from '../store/useTrace.js';

function usePlayLoop() {
  const playing = useTrace((s) => s.playing);
  const speed = useTrace((s) => s.speed);
  const advance = useTrace((s) => s.advance);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf;
    last.current = performance.now();
    const tick = (now) => {
      if (now - last.current >= 1000 / speed) {
        last.current = now;
        advance();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, advance]);
}

export default function Controls() {
  usePlayLoop();
  // Separate selectors on purpose: an object selector would return a fresh
  // object on every snapshot and make React 18 re-render in a loop.
  const index = useTrace((s) => s.index);
  const total = useTrace((s) => Math.max(s.frames.length, s.framesB ? s.framesB.length : 0));
  const playing = useTrace((s) => s.playing);
  const speed = useTrace((s) => s.speed);
  const { toggle, stepBack, stepForward, restart, seek, setSpeed } = useTrace.getState();
  const atEnd = index >= total - 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('.monaco-editor')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        useTrace.getState().toggle();
      }
      if (e.code === 'ArrowRight') useTrace.getState().stepForward();
      if (e.code === 'ArrowLeft') useTrace.getState().stepBack();
      if (e.code === 'KeyR') useTrace.getState().restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="controls">
      <div className="controls__buttons">
        <button className="btn" onClick={restart} title="Restart (R)">
          ⟲
        </button>
        <button className="btn" onClick={stepBack} title="Step back (←)">
          ‹
        </button>
        <button className="btn btn--primary" onClick={toggle} title="Play / pause (Space)">
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button className="btn" onClick={stepForward} title="Step forward (→)">
          ›
        </button>
      </div>

      <input
        className="scrub"
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={index}
        onChange={(e) => seek(Number(e.target.value))}
      />

      <div className="controls__meta">
        <span className="mono">
          {index + 1} / {total}
        </span>
        <label className="speed">
          Speed
          <input
            type="range"
            min={1}
            max={60}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="mono">{speed}/s</span>
        </label>
      </div>
    </div>
  );
}
