import { useTrace } from '../store/useTrace.js';
import { algorithms, byId, categories } from '../algorithms/index.js';

export default function StatsPanel() {
  const algoId = useTrace((s) => s.algoId);
  const index = useTrace((s) => s.index);
  const frame = useTrace((s) => s.frames[s.index]);
  const total = useTrace((s) => s.frames.length);
  const buildMs = useTrace((s) => s.buildMs);
  const size = useTrace((s) => s.array.length);
  const { selectAlgo, shuffle, resize, regenerateGrid } = useTrace.getState();
  const algo = byId(algoId);

  return (
    <aside className="panel">
      <div className="panel__block">
        {categories.map((cat) => (
          <div key={cat.id} className="picker">
            <h3>{cat.label}</h3>
            <div className="picker__items">
              {algorithms
                .filter((a) => a.category === cat.id)
                .map((a) => (
                  <button
                    key={a.id}
                    className={`chip ${a.id === algoId ? 'chip--on' : ''}`}
                    onClick={() => selectAlgo(a.id)}
                  >
                    {a.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel__block">
        <h3>Input</h3>
        {algo.category === 'sorting' ? (
          <>
            <button className="btn btn--wide" onClick={shuffle}>
              Shuffle values
            </button>
            <label className="slider">
              Elements <span className="mono">{size}</span>
              <input
                type="range"
                min={8}
                max={64}
                value={size}
                onChange={(e) => resize(Number(e.target.value))}
              />
            </label>
          </>
        ) : (
          <button className="btn btn--wide" onClick={regenerateGrid}>
            New maze
          </button>
        )}
      </div>

      <div className="panel__block">
        <h3>Live counters</h3>
        <dl className="counters">
          {Object.entries(frame.counters).map(([k, v]) => (
            <div key={k}>
              <dt>{k.replace(/([A-Z])/g, ' $1')}</dt>
              <dd className="mono">{v}</dd>
            </div>
          ))}
          <div>
            <dt>step</dt>
            <dd className="mono">
              {index + 1}/{total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="panel__block">
        <h3>Complexity</h3>
        <dl className="counters">
          <div>
            <dt>average</dt>
            <dd className="mono">{algo.bigO.time}</dd>
          </div>
          <div>
            <dt>best case</dt>
            <dd className="mono">{algo.bigO.best}</dd>
          </div>
          <div>
            <dt>extra space</dt>
            <dd className="mono">{algo.bigO.space}</dd>
          </div>
          <div>
            <dt>trace built in</dt>
            <dd className="mono">{buildMs.toFixed(1)} ms</dd>
          </div>
        </dl>
      </div>

      <p className="narration">{frame.note}</p>
    </aside>
  );
}
