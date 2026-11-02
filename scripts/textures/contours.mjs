// Generates public/textures/contours.svg: a seamless topographic tile for the
// bento site's survey-map texture (docs/redesign/BENTO_MOTION.md "Texture").
// Periodic fractal value noise, marching squares per level, segments joined
// into polylines; every INDEX_EVERY-th level is an index contour, drawn heavier.
// Deterministic: same SEED, same file. Run: node scripts/textures/contours.mjs
import { writeFileSync } from 'node:fs'

const W = 960
const H = 640
const CELL = 8
const SEED = 1987
const OCTAVES = 4
const BASE_PERIOD = [3, 2] // lattice cells across the tile at the lowest octave
const LEVELS = 16
const INDEX_EVERY = 4
/** Closed loops shorter than this read as specks, not terrain. */
const MIN_LENGTH = 24

const gx = W / CELL
const gy = H / CELL

const hash = (x, y, o) => {
  let h = (x * 374761393 + y * 668265263 + o * 2147483647 + SEED * 1274126177) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
const smooth = (t) => t * t * (3 - 2 * t)

const valueNoise = (u, v, px, py, o) => {
  const x = u * px
  const y = v * py
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const at = (i, j) => hash(((i % px) + px) % px, ((j % py) + py) % py, o)
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx
  const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx
  return a + (b - a) * ty
}

const field = (u, v) => {
  let sum = 0
  let amp = 1
  let norm = 0
  for (let o = 0; o < OCTAVES; o++) {
    sum += amp * valueNoise(u, v, BASE_PERIOD[0] << o, BASE_PERIOD[1] << o, o)
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}

const grid = Array.from({ length: gy + 1 }, (_, j) => Array.from({ length: gx + 1 }, (_, i) => field(i / gx, j / gy)))
const flat = grid.flat()
const lo = Math.min(...flat)
const hi = Math.max(...flat)

const lerp = (a, b, level) => (level - a) / (b - a)
const key = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`

function segmentsAt(level) {
  const out = []
  for (let j = 0; j < gy; j++) {
    for (let i = 0; i < gx; i++) {
      const v = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]]
      const x = i * CELL
      const y = j * CELL
      const edge = [
        () => [x + lerp(v[0], v[1], level) * CELL, y],
        () => [x + CELL, y + lerp(v[1], v[2], level) * CELL],
        () => [x + lerp(v[3], v[2], level) * CELL, y + CELL],
        () => [x, y + lerp(v[0], v[3], level) * CELL],
      ]
      const crossed = [0, 1, 2, 3].filter((e) => (v[e] > level) !== (v[(e + 1) % 4] > level))
      if (crossed.length === 2) out.push([edge[crossed[0]](), edge[crossed[1]]()])
      if (crossed.length === 4) {
        const centre = (v[0] + v[1] + v[2] + v[3]) / 4 > level
        const pairs = centre === v[0] > level ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]]
        for (const [a, b] of pairs) out.push([edge[a](), edge[b]()])
      }
    }
  }
  return out
}

function join(segments) {
  const ends = new Map()
  const add = (k, idx) => (ends.get(k) ?? ends.set(k, []).get(k)).push(idx)
  segments.forEach(([a, b], idx) => {
    add(key(a), idx)
    add(key(b), idx)
  })
  const used = new Uint8Array(segments.length)
  const lines = []
  const extend = (line) => {
    for (;;) {
      const tail = line[line.length - 1]
      const next = (ends.get(key(tail)) ?? []).find((n) => !used[n])
      if (next === undefined) return
      used[next] = 1
      const [a, b] = segments[next]
      line.push(key(a) === key(tail) ? b : a)
    }
  }
  segments.forEach(([a, b], idx) => {
    if (used[idx]) return
    used[idx] = 1
    const line = [a, b]
    extend(line)
    line.reverse()
    extend(line)
    lines.push(line)
  })
  return lines
}

const length = (line) => line.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - line[i][0], p[1] - line[i][1]), 0)
const n = (x) => String(Math.round(x * 10) / 10)
const pathOf = (lines) => lines.map((l) => `M${l.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}`).join('')

const minor = []
const major = []
for (let k = 1; k <= LEVELS; k++) {
  const level = lo + ((hi - lo) * k) / (LEVELS + 1)
  ;(k % INDEX_EVERY === 0 ? major : minor).push(...join(segmentsAt(level)).filter((l) => length(l) >= MIN_LENGTH))
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round"><path stroke-width="0.8" d="${pathOf(minor)}"/><path stroke-width="1.5" d="${pathOf(major)}"/></g></svg>\n`
writeFileSync(new URL('../../public/textures/contours.svg', import.meta.url), svg)
console.log(`contours.svg: ${minor.length} minor, ${major.length} index lines, ${(svg.length / 1024).toFixed(1)} KB`)
