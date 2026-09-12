import { useTrace } from '../store/useTrace.js'
import { byId } from '../algorithms/index.js'

// Floating caption over the canvas. Keeping it on the scene rather than in the
// side panel means your eyes never leave the thing that just changed.
const LEGENDS = {
  sorting: [
    ['#F2B134', 'being compared'],
    ['#E4626F', 'swapping'],
    ['#B487F5', 'pivot / key'],
    ['#48C79A', 'in final place'],
  ],
  pathfinding: [
    ['#F2B134', 'frontier'],
    ['#2F6BA8', 'already visited'],
    ['#33456B', 'slow terrain'],
    ['#48C79A', 'shortest path'],
  ],
  recursion: [
    ['#4EA8DE', 'called'],
    ['#3E5C89', 'waiting on a child'],
    ['#48C79A', 'returning'],
    ['#B487F5', 'answered from cache'],
  ],
  tree: [
    ['#F2B134', 'current node'],
    ['#48C79A', 'already visited'],
    ['#B487F5', 'waiting in the queue'],
    ['#3E6398', 'untouched'],
  ],
}

export default function Narration() {
  const note = useTrace((s) => s.frames[s.index].note)
  const algoId = useTrace((s) => s.algoId)
  const index = useTrace((s) => s.index)
  const cinematic = useTrace((s) => s.cinematic)
  const toggleCinematic = useTrace((s) => s.toggleCinematic)
  const algo = byId(algoId)

  return (
    <>
      <div className="hud hud--top">
        <span className="hud__name">{algo.name}</span>
        <button className={`ghost ${cinematic ? 'ghost--on' : ''}`} onClick={toggleCinematic}>
          {cinematic ? 'Auto-orbit on' : 'Auto-orbit off'}
        </button>
      </div>
      <ul className="legend">
        {LEGENDS[algo.category].map(([color, label]) => (
          <li key={label}>
            <i style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>
      <p className="hud hud--caption" key={index}>
        {note}
      </p>
    </>
  )
}
