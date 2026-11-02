import { buildPairReading, type AtlasPerson } from './pair'
import type { PairReading } from '@/lib/relations/pair-ties'

export interface CircleNode {
  readonly id: string
  /** Unit coordinates, -1..1, hub at the origin. */
  readonly x: number
  readonly y: number
}

export interface CircleReading {
  readonly hub: string
  readonly nodes: readonly CircleNode[]
  readonly pairs: readonly PairReading[]
}

/** Closest a spoke may sit to the hub, as a share of the ring radius. */
export const INNER_RING = 0.62

const key = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)

/**
 * Lay a group out by tie weight. The hub is the person whose ties carry the
 * most bits in total. Everyone else sits on a ring, nearer the hub the more
 * bits they share with it, and next to the person they share most with, so
 * the strongest ties are the shortest lines.
 */
export function layoutCircle(ids: readonly string[], pairs: readonly PairReading[]): Omit<CircleReading, 'pairs'> {
  const bits = new Map(pairs.map((p) => [key(p.a, p.b), p.bits]))
  const between = (a: string, b: string): number => bits.get(key(a, b)) ?? 0
  const total = (id: string): number => ids.reduce((sum, other) => (other === id ? sum : sum + between(id, other)), 0)

  const hub = [...ids].sort((a, b) => total(b) - total(a) || a.localeCompare(b))[0] ?? ''
  const order: string[] = []
  const rest = new Set(ids.filter((id) => id !== hub))
  let previous = hub
  while (rest.size > 0) {
    const next = [...rest].sort((a, b) => between(previous, b) - between(previous, a) || a.localeCompare(b))[0]
    order.push(next)
    rest.delete(next)
    previous = next
  }

  const strongest = Math.max(0, ...order.map((id) => between(hub, id)))
  const nodes: CircleNode[] = [
    { id: hub, x: 0, y: 0 },
    ...order.map((id, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / order.length
      const pull = strongest > 0 ? between(hub, id) / strongest : 0
      const r = 1 - (1 - INNER_RING) * pull
      return { id, x: Math.cos(angle) * r, y: Math.sin(angle) * r }
    }),
  ]
  return { hub, nodes }
}

/** Every pair in the group, read and laid out. Heavy: one engine call per pair. */
export function buildCircle(people: readonly AtlasPerson[]): CircleReading {
  const pairs = people.flatMap((a, i) => people.slice(i + 1).map((b) => buildPairReading(a, b)))
  return { ...layoutCircle(people.map((p) => p.id), pairs), pairs }
}
