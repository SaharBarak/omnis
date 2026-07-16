import type { PersonWithTags } from '@pleiad/api-client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeMutable, useSharedValue, type SharedValue } from 'react-native-reanimated'

import type { PinnedLayout } from '@/lib/map/layout-store'
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
 *
 * Pinned stars (the self star, plus any the user drags) are held fixed: the
 * sim reads their live position each frame and never writes it back, so a
 * dragged star stays where it lands and the rest of the sky reflows around
 * it. `startDrag`/`endDrag`/`unpin` drive that lifecycle and re-warm the sim.
 */

export interface NodePosition {
  x: SharedValue<number>
  y: SharedValue<number>
}

export interface ForceLayout {
  positions: ReadonlyMap<string, NodePosition>
  /** The id of the star under an active drag, or null. Set by the gesture. */
  activeDragId: SharedValue<string | null>
  /** Ids currently pinned — drives the pinned-ring on those nodes. */
  pinnedIds: ReadonlySet<string>
  /** Called from the gesture's onStart to warm the sim while a star is dragged. */
  startDrag: (id: string) => void
  /** Called from the gesture's onEnd to pin the dragged star at its drop point. */
  endDrag: (id: string) => void
  /** Release a pinned star back into the flow. */
  unpin: (id: string) => void
}

const TICKS_PER_FRAME = 2
/** Alpha floor held while a star is being dragged, so neighbors keep reflowing. */
const DRAG_ALPHA = 0.12

export function useForceLayout(
  people: PersonWithTags[],
  /** Unique unordered pairs of person ids with at least one relationship. */
  pairs: ReadonlyArray<readonly [string, string]>,
  size: { width: number; height: number } | null,
  reducedMotion: boolean,
  /** Persisted pins to seed (stable identity), and a sink for pin changes. */
  persistence: { initial: PinnedLayout; onChange: (layout: PinnedLayout) => void }
): ForceLayout {
  const { initial, onChange } = persistence

  // Positions survive re-layouts (filters, new people) — a person keeps
  // their star while the map re-settles around them.
  const lastPositions = useRef(new Map<string, { x: number; y: number }>())
  const hasRun = useRef(false)
  // The live set of pinned stars and their fixed positions. Source of truth
  // for both seeding and the "is this node fixed" test inside the sim.
  const pinnedRef = useRef(new Map<string, { x: number; y: number }>())
  const [pinnedIds, setPinnedIds] = useState<ReadonlySet<string>>(new Set())
  const activeDragId = useSharedValue<string | null>(null)

  // Restarts the running loop (rAF) or re-settles (reduced motion). Rebuilt by
  // the main effect for the current sim; a ref so pin/unpin can call it.
  const restartRef = useRef<((alpha: number) => void) | null>(null)

  const peopleKey = people.map((person) => person.id).join('|')
  const selfId = people.find((person) => person.is_self)?.id ?? null

  const positions = useMemo(() => {
    const map = new Map<string, NodePosition>()
    let step = 1
    for (const person of people) {
      const pinned = pinnedRef.current.get(person.id)
      const remembered = lastPositions.current.get(person.id)
      const seed =
        pinned ??
        remembered ??
        (person.id === selfId ? { x: 0, y: 0 } : seedPosition(step))
      if (pinned === undefined && remembered === undefined && person.id !== selfId) step += 1
      map.set(person.id, { x: makeMutable(seed.x), y: makeMutable(seed.y) })
    }
    return map
    // Rebuild only when the set of people changes, not on refetch identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey, selfId])

  const pairsKey = pairs.map(([a, b]) => `${a}~${b}`).join('|')

  const currentLayout = useCallback((): PinnedLayout => {
    const layout: PinnedLayout = {}
    for (const [id, point] of pinnedRef.current) layout[id] = { x: point.x, y: point.y }
    return layout
  }, [])

  const kick = useCallback((alpha: number) => {
    restartRef.current?.(alpha)
  }, [])

  // Seed persisted pins once they load (identity change from the empty default).
  useEffect(() => {
    let changed = false
    for (const [id, point] of Object.entries(initial)) {
      if (!positions.has(id)) continue
      pinnedRef.current.set(id, point)
      lastPositions.current.set(id, point)
      const position = positions.get(id)
      if (position !== undefined) {
        position.x.value = point.x
        position.y.value = point.y
      }
      changed = true
    }
    if (changed) {
      setPinnedIds(new Set(pinnedRef.current.keys()))
      kick(ALPHA_RESTART)
    }
    // initial has a stable identity from the screen; positions covers people changes.
  }, [initial, positions, kick])

  const startDrag = useCallback(
    (_id: string) => {
      kick(DRAG_ALPHA)
    },
    [kick]
  )

  const endDrag = useCallback(
    (id: string) => {
      const position = positions.get(id)
      if (position === undefined) return
      const point = { x: position.x.value, y: position.y.value }
      pinnedRef.current.set(id, point)
      lastPositions.current.set(id, point)
      setPinnedIds(new Set(pinnedRef.current.keys()))
      onChange(currentLayout())
      kick(ALPHA_RESTART)
    },
    [positions, onChange, currentLayout, kick]
  )

  const unpin = useCallback(
    (id: string) => {
      if (!pinnedRef.current.delete(id)) return
      setPinnedIds(new Set(pinnedRef.current.keys()))
      onChange(currentLayout())
      // Let the released star rejoin the flow from where it sits.
      kick(ALPHA_RESTART)
    },
    [onChange, currentLayout, kick]
  )

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

    // A star is fixed if it's self, a pinned star, or under an active drag.
    // Fixed stars feed their live position into the sim but are never moved by it.
    const applyFixed = () => {
      for (const node of simNodes) {
        const fixed =
          node.id === selfId ||
          pinnedRef.current.has(node.id) ||
          activeDragId.value === node.id
        node.pinned = fixed
        if (fixed) {
          const position = positions.get(node.id)
          if (position !== undefined) {
            node.x = position.x.value
            node.y = position.y.value
          }
        }
      }
    }

    const write = () => {
      for (const node of simNodes) {
        if (node.pinned) continue
        const position = positions.get(node.id)
        if (position === undefined) continue
        position.x.value = node.x
        position.y.value = node.y
        lastPositions.current.set(node.id, { x: node.x, y: node.y })
      }
    }

    if (reducedMotion) {
      const resettle = () => {
        applyFixed()
        settle(simNodes, simLinks, bounds)
        write()
      }
      resettle()
      hasRun.current = true
      restartRef.current = resettle
      return () => {
        restartRef.current = null
      }
    }

    let alpha = hasRun.current ? ALPHA_RESTART : ALPHA_START
    hasRun.current = true
    let frame: number | null = null

    const step = () => {
      // Hold the sim warm while a star is dragged so its neighbors keep moving.
      if (activeDragId.value !== null && alpha < DRAG_ALPHA) alpha = DRAG_ALPHA
      applyFixed()
      for (let i = 0; i < TICKS_PER_FRAME && alpha >= ALPHA_MIN; i += 1) {
        alpha = tick(simNodes, simLinks, alpha, bounds)
      }
      write()
      if (alpha >= ALPHA_MIN || activeDragId.value !== null) {
        frame = requestAnimationFrame(step)
      } else {
        frame = null
      }
    }

    restartRef.current = (nextAlpha: number) => {
      if (alpha < nextAlpha) alpha = nextAlpha
      if (frame === null) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      restartRef.current = null
    }
    // pairsKey stands in for the pairs array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, pairsKey, size?.width, size?.height, reducedMotion, selfId])

  return { positions, activeDragId, pinnedIds, startDrag, endDrag, unpin }
}
