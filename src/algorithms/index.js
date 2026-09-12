import { sortingAlgorithms } from './sorting.js'
import { pathfindingAlgorithms, makeGrid } from './pathfinding.js'
import { recursionAlgorithms } from './recursion.js'
import { treeAlgorithms, makeTreeValues } from './tree.js'

export const algorithms = [
  ...sortingAlgorithms,
  ...pathfindingAlgorithms,
  ...recursionAlgorithms,
  ...treeAlgorithms,
]

export const byId = (id) => algorithms.find((a) => a.id === id) ?? algorithms[0]

export const categories = [
  { id: 'sorting', label: 'Sorting', blurb: 'Bars rearranging themselves' },
  { id: 'pathfinding', label: 'Pathfinding', blurb: 'A wavefront crossing a maze' },
  { id: 'recursion', label: 'Recursion', blurb: 'The call stack as a tower' },
  { id: 'tree', label: 'Trees', blurb: 'A binary search tree in space' },
]

export { makeGrid, makeTreeValues }
