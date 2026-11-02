/**
 * The bento site's background texture: a star chart of the band of sky the
 * map is drawn from (docs/redesign/BENTO_MOTION.md "Texture"). Real stars
 * from d3-celestial's catalogue (BSD-3-Clause, Olaf Frohn), whose star data
 * is XHIP, the extended Hipparcos compilation (Anderson and Francis 2012,
 * VizieR V/137D), with the hour and declination grid, the ecliptic, the
 * constellation figures and a ring round the Pleiades.
 *
 * The projection is equidistant cylindrical: right ascension runs right to
 * left as on a sky chart, so the tile repeats across without a seam. Nothing
 * crosses the band's edge (stars are kept whole, figures that leave the band
 * are left out), so the tile also repeats down. Pure and deterministic:
 * `npm run texture:sky` writes what `skySvg` returns, and a test compares.
 */

/** Right ascension and declination in degrees, then visual magnitude. */
export type Star = readonly [number, number, number]
export type Point = readonly [number, number]

export interface SkyCatalogue {
  readonly source: string
  readonly stars: readonly Star[]
  readonly figures: readonly (readonly Point[])[]
}

export const SKY = Object.freeze({
  /** Half-height of the band in degrees: the zodiac and the equator with room either side. */
  band: 45,
  /** Drawing units per degree; the tile is 360 × 2·band degrees. */
  scale: 10,
  /** Faintest star kept: naked-eye stars under a dark suburban sky. */
  faintest: 5.5,
  /** Obliquity of the ecliptic, J2000. */
  obliquity: 23.4393,
  /** M45, the Pleiades, J2000, and the ring drawn round it. */
  pleiades: Object.freeze({ ra: 56.75, dec: 24.12, radius: 1.4 }),
  grid: Object.freeze({ ra: 15, dec: 15 }),
  /** Star radius in drawing units at magnitude −1.5 and the smallest drawn. */
  radius: Object.freeze({ brightest: 3.4, least: 0.7 }),
})

export const SKY_UPSTREAM = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/7e720a3de062059d4c5400a379146a601d9010e0/data'

export const SKY_FILES = Object.freeze({
  catalogue: 'src/lib/textures/data/sky-catalogue.json',
  licence: 'src/lib/textures/data/LICENSE-d3-celestial',
  svg: 'public/textures/sky.svg',
})

const W = 360 * SKY.scale
const H = 2 * SKY.band * SKY.scale
const round = (n: number): number => Math.round(n * 10) / 10
const fix = (n: number): number => Math.round(n * 100) / 100
const raOf = (lon: number): number => (lon + 360) % 360
const x = (ra: number): number => round(W - ra * SKY.scale)
const y = (dec: number): number => round((SKY.band - dec) * SKY.scale)
const inBand = (dec: number): boolean => Math.abs(dec) <= SKY.band

/**
 * Star radius in drawing units. A compressed scale: the radius shrinks by
 * 10^0.1 (×1.26) per magnitude, so faint stars still show; drawn as true
 * area (×1.58 in radius per magnitude) most of them would vanish.
 */
export const starRadius = (mag: number): number => round(Math.max(SKY.radius.least, SKY.radius.brightest * 10 ** (-0.1 * (mag + 1.5))))
const starAlpha = (mag: number): number => Math.round(Math.min(1, Math.max(0.45, 1.05 - 0.09 * mag)) * 100) / 100

/** A star is drawn only when all of its disc lies in the band. */
export const starInBand = ([, dec, mag]: Star): boolean => Math.abs(dec) + starRadius(mag) / SKY.scale <= SKY.band

interface Feature<G> {
  readonly properties: { readonly mag: number }
  readonly geometry: G
}

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/** Downloads the pinned upstream catalogue and keeps what the chart can draw. */
export async function fetchCatalogue(): Promise<SkyCatalogue> {
  const [stars, figures] = await Promise.all([
    json<{ features: Feature<{ coordinates: [number, number] }>[] }>(`${SKY_UPSTREAM}/stars.6.json`),
    json<{ features: Omit<Feature<{ coordinates: [number, number][][] }>, 'properties'>[] }>(`${SKY_UPSTREAM}/constellations.lines.json`),
  ])
  return {
    source: `${SKY_UPSTREAM}/{stars.6.json,constellations.lines.json}`,
    stars: stars.features
      .map(({ properties: { mag }, geometry: { coordinates: [lon, dec] } }): Star => [fix(raOf(lon)), fix(dec), mag])
      .filter(([, dec, mag]) => mag <= SKY.faintest && Math.abs(dec) <= SKY.band + 5)
      .sort((a, b) => a[2] - b[2] || a[0] - b[0]),
    figures: figures.features.flatMap(({ geometry }) => geometry.coordinates.map((line) => line.map(([lon, dec]): Point => [fix(raOf(lon)), fix(dec)]))),
  }
}

/** A star whose disc crosses the tile's side is drawn again one tile over, so the wrap has no seam. */
function starPath(cx: number, cy: number, r: number): string {
  const shifts = [0, ...(cx - r < 0 ? [W] : []), ...(cx + r > W ? [-W] : [])]
  return shifts.map((shift) => `M${round(cx + shift - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('')
}

function starsLayer(stars: readonly Star[]): string[] {
  const byAlpha = new Map<number, string>()
  for (const star of stars.filter(starInBand)) {
    const [ra, dec, mag] = star
    const alpha = starAlpha(mag)
    byAlpha.set(alpha, `${byAlpha.get(alpha) ?? ''}${starPath(x(ra), y(dec), starRadius(mag))}`)
  }
  return [...byAlpha].sort(([a], [b]) => a - b).map(([alpha, d]) => `<path fill-opacity="${alpha}" d="${d}"/>`)
}

/** A segment crossing right ascension 0 is drawn as its two halves, one on either side. */
function segments(line: readonly Point[]): string[] {
  return line.slice(1).flatMap((b, i) => {
    const a = line[i]
    if (!inBand(a[1]) || !inBand(b[1])) return []
    const span = b[0] - a[0]
    const [ax, bx] = [x(a[0]), x(b[0])]
    if (Math.abs(span) <= 180) return [`M${ax} ${y(a[1])}L${bx} ${y(b[1])}`]
    const shift = span > 0 ? W : -W
    return [`M${ax} ${y(a[1])}L${round(bx + shift)} ${y(b[1])}`, `M${round(ax - shift)} ${y(a[1])}L${bx} ${y(b[1])}`]
  })
}

function gridLayer(): string[] {
  const meridians = Array.from({ length: 360 / SKY.grid.ra }, (_, i) => `M${x(i * SKY.grid.ra)} 0V${H}`)
  const parallels = Array.from({ length: (2 * SKY.band) / SKY.grid.dec + 1 }, (_, i) => -SKY.band + i * SKY.grid.dec)
    .filter((dec) => dec !== 0 && Math.abs(dec) < SKY.band)
    .map((dec) => `M0 ${y(dec)}H${W}`)
  return [
    `<path stroke-width="0.6" stroke-opacity="0.32" d="${[...meridians, ...parallels].join('')}"/>`,
    `<path stroke-width="0.9" stroke-opacity="0.5" d="M0 ${y(0)}H${W}"/>`,
  ]
}

function eclipticLayer(): string {
  const tanE = Math.tan((SKY.obliquity * Math.PI) / 180)
  const points = Array.from({ length: 361 }, (_, ra) => `${x(ra)} ${y((Math.atan(Math.sin((ra * Math.PI) / 180) * tanE) * 180) / Math.PI)}`)
  return `<path stroke-width="0.9" stroke-opacity="0.55" stroke-dasharray="6 5" d="M${points.join('L')}"/>`
}

const pleiadesLayer = (): string =>
  `<circle cx="${x(SKY.pleiades.ra)}" cy="${y(SKY.pleiades.dec)}" r="${SKY.pleiades.radius * SKY.scale}" fill="none" stroke-width="0.8" stroke-opacity="0.7"/>`

/** The tile. `licence` is the upstream licence text, carried in the file as the BSD licence asks. */
export function skySvg({ stars, figures }: SkyCatalogue, licence: string): string {
  const notice = licence.trim().replaceAll('--', '- -')
  return `${[
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<!-- Star positions and constellation figures: d3-celestial (${SKY_UPSTREAM}).\nStar data: XHIP, An Extended Hipparcos Compilation, Anderson E., Francis C. (2012), VizieR V/137D.\n${notice}\n-->`,
    `<g fill="none" stroke="#000" stroke-linecap="round">`,
    ...gridLayer(),
    eclipticLayer(),
    `<path stroke-width="0.7" stroke-opacity="0.6" d="${figures.flatMap(segments).join('')}"/>`,
    pleiadesLayer(),
    `</g>`,
    `<g fill="#000">`,
    ...starsLayer(stars),
    `</g>`,
    `</svg>`,
  ].join('\n')}\n`
}
