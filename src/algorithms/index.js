import { sortingAlgorithms } from './sorting.js'
import { pathfindingAlgorithms, makeGrid } from './pathfinding.js'

export const algorithms = [...sortingAlgorithms, ...pathfindingAlgorithms]

export const byId = (id) => algorithms.find((a) => a.id === id) ?? algorithms[0]

export const categories = [
  { id: 'sorting', label: 'Sorting' },
  { id: 'pathfinding', label: 'Pathfinding' },
]

export { makeGrid }
