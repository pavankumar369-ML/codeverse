import { useState } from 'react'
import { useTrace, frameAt } from '../store/useTrace.js'
import { algorithms, byId, categories } from '../algorithms/index.js'
import { currentLink } from '../lib/permalink.js'

function InputControls({ algo }) {
  const size = useTrace((s) => s.array.length)
  const depth = useTrace((s) => s.depth)
  const treeCount = useTrace((s) => s.treeValues.length)
  const { shuffle, resize, regenerateGrid, setDepth, regenerateTree } = useTrace.getState()

  if (algo.category === 'sorting') {
    return (
      <>
        <button className="btn btn--wide" onClick={shuffle}>
          Shuffle values
        </button>
        <label className="slider">
          Elements <span className="mono">{size}</span>
          <input type="range" min={8} max={64} value={size} onChange={(e) => resize(Number(e.target.value))} />
        </label>
      </>
    )
  }
  if (algo.category === 'pathfinding') {
    return (
      <button className="btn btn--wide" onClick={regenerateGrid}>
        New maze
      </button>
    )
  }
  if (algo.category === 'recursion') {
    const max = algo.id === 'hanoi' ? 6 : algo.id === 'permutations' ? 5 : 10
    return (
      <label className="slider">
        {algo.id === 'hanoi' ? 'Disks' : algo.id === 'permutations' ? 'Letters' : 'n'}
        <span className="mono">{Math.min(depth, max)}</span>
        <input type="range" min={2} max={max} value={Math.min(depth, max)} onChange={(e) => setDepth(Number(e.target.value))} />
      </label>
    )
  }
  return (
    <>
      <button className="btn btn--wide" onClick={() => regenerateTree(treeCount)}>
        New values
      </button>
      <label className="slider">
        Nodes <span className="mono">{treeCount}</span>
        <input type="range" min={5} max={24} value={treeCount} onChange={(e) => regenerateTree(Number(e.target.value))} />
      </label>
    </>
  )
}

function RaceBoard({ algo }) {
  const opponentId = useTrace((s) => s.opponentId)
  const index = useTrace((s) => s.index)
  const frames = useTrace((s) => s.frames)
  const framesB = useTrace((s) => s.framesB)
  const { setOpponent, clearOpponent } = useTrace.getState()

  const rivals = algorithms.filter((a) => a.category === algo.category && a.id !== algo.id)

  if (!opponentId || !framesB) {
    return (
      <div className="panel__block">
        <h3>Race</h3>
        <p className="hint">Run a second algorithm on the same input, side by side.</p>
        <div className="picker__items">
          {rivals.map((a) => (
            <button key={a.id} className="chip" onClick={() => setOpponent(a.id)}>
              vs {a.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const rival = byId(opponentId)
  const a = frameAt(frames, index).counters
  const b = frameAt(framesB, index).counters
  // Shared counter names only — comparing "swaps" against "shifts" would lie.
  const keys = Object.keys(a).filter((k) => k in b)
  const doneA = index >= frames.length - 1
  const doneB = index >= framesB.length - 1
  const winner = frames.length === framesB.length ? null : frames.length < framesB.length ? algo.name : rival.name

  return (
    <div className="panel__block">
      <h3>Race</h3>
      <table className="race">
        <thead>
          <tr>
            <th />
            <th>{algo.name}</th>
            <th>{rival.name}</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td>{k.replace(/([A-Z])/g, ' $1')}</td>
              <td className={`mono ${a[k] < b[k] ? 'lead' : ''}`}>{a[k]}</td>
              <td className={`mono ${b[k] < a[k] ? 'lead' : ''}`}>{b[k]}</td>
            </tr>
          ))}
          <tr>
            <td>steps</td>
            <td className="mono">{frames.length}</td>
            <td className="mono">{framesB.length}</td>
          </tr>
        </tbody>
      </table>
      <p className="hint">
        {doneA && doneB
          ? winner
            ? `${winner} finished in fewer steps.`
            : 'Both finished in the same number of steps.'
          : doneA
            ? `${algo.name} is done and waiting.`
            : doneB
              ? `${rival.name} is done and waiting.`
              : 'Both still running.'}
      </p>
      <button className="btn btn--wide" onClick={clearOpponent}>
        End race
      </button>
    </div>
  )
}

export default function StatsPanel() {
  const algoId = useTrace((s) => s.algoId)
  const index = useTrace((s) => s.index)
  const frame = useTrace((s) => frameAt(s.frames, s.index))
  const total = useTrace((s) => Math.max(s.frames.length, s.framesB ? s.framesB.length : 0))
  const buildMs = useTrace((s) => s.buildMs)
  const algo = byId(algoId)
  const [tab, setTab] = useState(algo.category)
  const [copied, setCopied] = useState(false)
  const { selectAlgo } = useTrace.getState()

  const shown = algorithms.filter((a) => a.category === tab)
  const active = categories.find((c) => c.id === tab)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentLink(useTrace.getState()))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside className="panel">
      <div className="tabs">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`tab ${tab === c.id ? 'tab--on' : ''} ${algo.category === c.id ? 'tab--live' : ''}`}
            onClick={() => setTab(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="tabs__blurb">{active.blurb}</p>

      <div className="picker__items">
        {shown.map((a) => (
          <button
            key={a.id}
            className={`chip ${a.id === algoId ? 'chip--on' : ''}`}
            onClick={() => selectAlgo(a.id)}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="panel__block">
        <h3>Input</h3>
        <InputControls algo={algo} />
      </div>

      <RaceBoard algo={algo} />

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

      <button className="btn btn--wide" onClick={copyLink}>
        {copied ? 'Link copied' : 'Copy link to this run'}
      </button>
      <p className="hint">The link carries the algorithm and its exact input.</p>
    </aside>
  )
}
