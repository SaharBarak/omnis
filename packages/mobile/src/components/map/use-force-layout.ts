import type { PersonWithTags } from '@pleiad/api-client'
import { useEffect, useMemo, useRef } from 'react'
import { makeMutable, type SharedValue } from 'react-native-reanimated'

import {
  ALPHA_MIN,
  ALPHA_RESTART,
  ALPHA_START,
  seedPosition,
  settle,
  tick,
  type SimBounds,
  type SimLink,
  type SimNode,
} from '@/lib/map/simulation'

/**
 * S10 layout runner. The simulation runs on the JS thread inside a
 * requestAnimationFrame loop, writing each node's position into Reanimated
 * shared values that the Skia edges and node views are bound to. Alpha
 * decays; when it crosses ALPHA_MIN the loop STOPS (no perpetual rAF).
 * Reduced motion: the simulation settles synchronously and the graph
 * renders at rest — no drift, ever.
 */

export interface NodePosition {
  x: SharedValue<number>
  y: SharedValue<number>
}

const TICKS_PER_FRAME = 2

export function useForceLayout(
  people: PersonWithTags[],
  /** Unique unordered pairs of person ids with at least one relationship. */
  pairs: ReadonlyArray<readonly [string, string]>,
  size: { width: number; height: number } | null,
  reducedMotion: boolean
): ReadonlyMap<string, NodePosition> {
  // Positions survive re-layouts (filters, new people) — a person keeps
  // their star while the map re-settles around them.
  const lastPositions = useRef(new Map<string, { x: number; y: number }>())
  const hasRun = useRef(false)

  const peopleKey = people.map((person) => person.id).join('|')
  const selfId = people.find((person) => person.is_self)?.id ?? null

  const positions = useMemo(() => {
    const map = new Map<string, NodePosition>()
    let step = 1
    for (const person of people) {
      const remembered = lastPositions.current.get(person.id)
      const seed =
        remembered ?? (person.id === selfId ? { x: 0, y: 0 } : seedPosition(step))
      if (remembered === undefined && person.id !== selfId) step += 1
      map.set(person.id, { x: makeMutable(seed.x), y: makeMutable(seed.y) })
    }
    return map
    // Rebuild only when the set of people changes, not on refetch identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey, selfId])

  const pairsKey = pairs.map(([a, b]) => `${a}~${b}`).join('|')

  useEffect(() => {
    if (size === null || positions.size === 0) return undefined

    const ids = [...positions.keys()]
    const indexOf = new Map(ids.map((id, index) => [id, index]))

    const simNodes: SimNode[] = ids.map((id) => {
      const position = positions.get(id)
      return {
        id,
        x: position?.x.value ?? 0,
        y: position?.y.value ?? 0,
        vx: 0,
        vy: 0,
        pinned: id === selfId,
      }
    })

    const simLinks: SimLink[] = []
    for (const [idA, idB] of pairs) {
      const a = indexOf.get(idA)
      const b = indexOf.get(idB)
      if (a !== undefined && b !== undefined) simLinks.push({ a, b })
    }

    const bounds: SimBounds = {
      halfWidth: size.width / 2,
      halfHeight: size.height / 2,
      padding: 64,
    }

    const write = () => {
      for (const node of simNodes) {
        const position = positions.get(node.id)
        if (position === undefined) continue
        position.x.value = node.x
        position.y.value = node.y
        lastPositions.current.set(node.id, { x: node.x, y: node.y })
      }
    }

    if (reducedMotion) {
      settle(simNodes, simLinks, bounds)
      write()
      hasRun.current = true
      return undefined
    }

    let alpha = hasRun.current ? ALPHA_RESTART : ALPHA_START
    hasRun.current = true
    let frame = 0

    const step = () => {
      for (let i = 0; i < TICKS_PER_FRAME && alpha >= ALPHA_MIN; i += 1) {
        alpha = tick(simNodes, simLinks, alpha, bounds)
      }
      write()
      if (alpha >= ALPHA_MIN) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
    // pairsKey stands in for the pairs array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, pairsKey, size?.width, size?.height, reducedMotion, selfId])

  return positions
}
