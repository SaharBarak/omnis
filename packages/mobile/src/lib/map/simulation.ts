/**
 * Force-directed layout — S10. A small, dependency-free simulation (no d3):
 * pairwise repulsion + spring edges + center gravity, integrated with
 * velocity damping under a decaying alpha. The runner (use-force-layout)
 * ticks it on requestAnimationFrame and STOPS when alpha crosses ALPHA_MIN —
 * never a perpetual loop. Sized for the spec's scale (≤60 nodes, ~100 edges).
 */

export interface SimNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  /** Pinned nodes (the self star) feel gravity's center but never move. */
  pinned: boolean
}

/** Indexes into the node array — resolved once by the runner. */
export interface SimLink {
  a: number
  b: number
}

export interface SimBounds {
  /** Half-extent from center along x — nodes clamp to ±(halfWidth − padding). */
  halfWidth: number
  halfHeight: number
  padding: number
}

export const ALPHA_START = 1
export const ALPHA_RESTART = 0.6
export const ALPHA_MIN = 0.004
const ALPHA_DECAY = 0.024

const REPULSION = 5200
const MIN_DISTANCE = 24
const SPRING_LENGTH = 108
const SPRING_STRENGTH = 0.055
const GRAVITY = 0.028
const VELOCITY_DECAY = 0.55

const GOLDEN_ANGLE = 2.399963229728653
const SPIRAL_STEP = 46

/**
 * Deterministic starting position n steps out on a golden-angle spiral —
 * no two nodes ever seed on top of each other, no randomness to re-shuffle
 * the map between visits.
 */
export function seedPosition(step: number): { x: number; y: number } {
  if (step === 0) return { x: 0, y: 0 }
  const radius = SPIRAL_STEP * Math.sqrt(step)
  const angle = step * GOLDEN_ANGLE
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** One integration step. Mutates nodes in place. Returns the next alpha. */
export function tick(
  nodes: SimNode[],
  links: SimLink[],
  alpha: number,
  bounds: SimBounds
): number {
  const count = nodes.length

  // Pairwise repulsion — O(n²) is fine at this scale.
  for (let i = 0; i < count; i += 1) {
    const nodeA = nodes[i]
    if (nodeA === undefined) continue
    for (let j = i + 1; j < count; j += 1) {
      const nodeB = nodes[j]
      if (nodeB === undefined) continue
      let dx = nodeB.x - nodeA.x
      let dy = nodeB.y - nodeA.y
      let distSq = dx * dx + dy * dy
      if (distSq < 1) {
        // Coincident nodes: nudge apart deterministically by index parity.
        dx = (i % 2 === 0 ? 1 : -1) * 0.5
        dy = (j % 2 === 0 ? 1 : -1) * 0.5
        distSq = 0.5
      }
      const dist = Math.sqrt(distSq)
      const clamped = Math.max(dist, MIN_DISTANCE)
      const force = (REPULSION * alpha) / (clamped * clamped)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      nodeA.vx -= fx
      nodeA.vy -= fy
      nodeB.vx += fx
      nodeB.vy += fy
    }
  }

  // Spring edges pull connected nodes toward the rest length.
  for (const link of links) {
    const nodeA = nodes[link.a]
    const nodeB = nodes[link.b]
    if (nodeA === undefined || nodeB === undefined) continue
    const dx = nodeB.x - nodeA.x
    const dy = nodeB.y - nodeA.y
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    const force = SPRING_STRENGTH * (dist - SPRING_LENGTH) * alpha
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    nodeA.vx += fx
    nodeA.vy += fy
    nodeB.vx -= fx
    nodeB.vy -= fy
  }

  // Center gravity + integration + soft bounds.
  const maxX = Math.max(40, bounds.halfWidth - bounds.padding)
  const maxY = Math.max(40, bounds.halfHeight - bounds.padding)
  for (const node of nodes) {
    if (node.pinned) {
      node.vx = 0
      node.vy = 0
      continue
    }
    node.vx -= node.x * GRAVITY * alpha
    node.vy -= node.y * GRAVITY * alpha
    node.vx *= VELOCITY_DECAY
    node.vy *= VELOCITY_DECAY
    node.x = clamp(node.x + node.vx, -maxX, maxX)
    node.y = clamp(node.y + node.vy, -maxY, maxY)
  }

  return alpha * (1 - ALPHA_DECAY)
}

/**
 * Run the whole simulation synchronously to its settled state — the
 * reduced-motion path (graph appears already at rest) and warm restarts.
 */
export function settle(
  nodes: SimNode[],
  links: SimLink[],
  bounds: SimBounds,
  maxTicks = 300
): void {
  let alpha = ALPHA_START
  for (let step = 0; step < maxTicks && alpha >= ALPHA_MIN; step += 1) {
    alpha = tick(nodes, links, alpha, bounds)
  }
}
