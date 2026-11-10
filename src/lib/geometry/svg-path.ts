/**
 * Flattens SVG path data into polygons and answers point-in-path with the
 * nonzero rule, so code that needs a drawing's area (rasterising the mark
 * into pixels) reads the same path strings the SVG draws, in Node and in the
 * browser alike. Supports the absolute commands M, L, A and Z, which is what
 * every path in src/lib/brand/mark.ts is written in.
 */

export type Point = readonly [x: number, y: number]
export type Polygon = readonly Point[]

/** Any command letter; `e` is left out because it belongs to exponents. */
const COMMAND = /([A-DF-Za-df-z])([^A-DF-Za-df-z]*)/g
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi

/** Segments per full turn of an arc; a quarter-unit chord error on the mark's largest radius. */
const ARC_STEPS_PER_TURN = 96

const numbersOf = (args: string): readonly number[] => (args.match(NUMBER) ?? []).map(Number)

const angleBetween = (ux: number, uy: number, vx: number, vy: number): number => {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1
  const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))
  return sign * Math.acos(Math.min(1, Math.max(-1, cos)))
}

/** SVG arc endpoint parameters to points along the arc, the start excluded (SVG 1.1 F.6.5). */
function arcPoints(from: Point, rx0: number, ry0: number, rotationDeg: number, large: boolean, sweep: boolean, to: Point): readonly Point[] {
  const [x1, y1] = from
  const [x2, y2] = to
  if (rx0 === 0 || ry0 === 0) return [to]
  const phi = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const xp = cos * dx + sin * dy
  const yp = -sin * dx + cos * dy
  const lambda = (xp * xp) / (rx0 * rx0) + (yp * yp) / (ry0 * ry0)
  const grow = lambda > 1 ? Math.sqrt(lambda) : 1
  const rx = Math.abs(rx0) * grow
  const ry = Math.abs(ry0) * grow
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp
  const den = rx * rx * yp * yp + ry * ry * xp * xp
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den))
  const cxp = (coef * rx * yp) / ry
  const cyp = (-coef * ry * xp) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const start = angleBetween(1, 0, (xp - cxp) / rx, (yp - cyp) / ry)
  let delta = angleBetween((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI
  const steps = Math.max(1, Math.ceil((Math.abs(delta) / (2 * Math.PI)) * ARC_STEPS_PER_TURN))
  return Array.from({ length: steps }, (_, i) => {
    if (i === steps - 1) return to
    const t = start + (delta * (i + 1)) / steps
    const ex = rx * Math.cos(t)
    const ey = ry * Math.sin(t)
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy] as const
  })
}

/** Absolute M, L, A and closing Z or z: the commands the mark's paths use. Relative commands would read as absolute, so they are refused. */
const SUPPORTED = new Set(['M', 'L', 'A', 'Z', 'z'])

/** Every subpath of `d` as a closed polygon. */
export function flattenPath(d: string): readonly Polygon[] {
  const polygons: Point[][] = []
  let current: Point[] = []
  let at: Point = [0, 0]
  const close = (): void => {
    if (current.length > 2) polygons.push(current)
    current = []
  }
  for (const [, command, args] of d.matchAll(COMMAND)) {
    if (!command || !SUPPORTED.has(command)) throw new Error(`Unsupported path command ${command ?? ''}`)
    const n = numbersOf(args ?? '')
    switch (command.toUpperCase()) {
      case 'M':
        close()
        at = [n[0] ?? 0, n[1] ?? 0]
        current.push(at)
        for (let i = 2; i + 1 < n.length; i += 2) current.push((at = [n[i] ?? 0, n[i + 1] ?? 0]))
        break
      case 'L':
        for (let i = 0; i + 1 < n.length; i += 2) current.push((at = [n[i] ?? 0, n[i + 1] ?? 0]))
        break
      case 'A':
        for (let i = 0; i + 6 < n.length; i += 7) {
          const to: Point = [n[i + 5] ?? 0, n[i + 6] ?? 0]
          current.push(...arcPoints(at, n[i] ?? 0, n[i + 1] ?? 0, n[i + 2] ?? 0, n[i + 3] === 1, n[i + 4] === 1, to))
          at = to
        }
        break
      case 'Z':
        close()
        break
      default:
        throw new Error(`Unsupported path command ${command ?? ''}`)
    }
  }
  close()
  return polygons
}

/** The nonzero winding number of `point` against every polygon. */
export function winding(polygons: readonly Polygon[], [x, y]: Point): number {
  let total = 0
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      const [ax, ay] = polygon[i] as Point
      const [bx, by] = polygon[(i + 1) % polygon.length] as Point
      const side = (bx - ax) * (y - ay) - (x - ax) * (by - ay)
      if (ay <= y && by > y && side > 0) total += 1
      else if (ay > y && by <= y && side < 0) total -= 1
    }
  }
  return total
}

/** Whether `point` is ink under the nonzero rule. */
export const insidePath = (polygons: readonly Polygon[], point: Point): boolean => winding(polygons, point) !== 0
