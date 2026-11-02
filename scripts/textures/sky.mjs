// Generates public/textures/sky.svg: the bento site's background texture, a
// star chart of the band of sky the map is drawn from (docs/redesign/BENTO_MOTION.md
// "Texture"). Real stars from the Hipparcos-derived catalogue in d3-celestial
// (BSD-3-Clause, Olaf Frohn), with the hour and declination grid, the ecliptic,
// the constellation figures and a ring round the Pleiades.
//
// The projection is equidistant cylindrical: right ascension runs right to
// left as on a sky chart, so the tile repeats across without a seam; the band
// is clipped at ±BAND degrees, and a figure crossing the clip is left out, so
// the tile also repeats down. Deterministic: same catalogue, same file.
//
//   node scripts/textures/sky.mjs           writes the SVG from the vendored catalogue
//   node scripts/textures/sky.mjs --fetch   refreshes the vendored catalogue first
import { readFileSync, writeFileSync } from 'node:fs'

const UPSTREAM = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/7e720a3de062059d4c5400a379146a601d9010e0/data'
const CATALOGUE = new URL('./data/sky-catalogue.json', import.meta.url)
const LICENSE = new URL('./data/LICENSE-d3-celestial', import.meta.url)
const OUT = new URL('../../public/textures/sky.svg', import.meta.url)

/** Half-height of the band in degrees: the zodiac and the equator with room either side. */
const BAND = 45
/** Drawing units per degree; the tile is 360 × 2·BAND degrees. */
const SCALE = 10
/** Faintest star kept: naked-eye stars under a dark suburban sky. */
const FAINTEST = 5.5
/** Obliquity of the ecliptic, J2000. */
const OBLIQUITY = 23.4393
/** M45, the Pleiades, J2000. */
const PLEIADES = { ra: 56.75, dec: 24.12, radius: 1.4 }
const GRID = { ra: 15, dec: 15 }

const W = 360 * SCALE
const H = 2 * BAND * SCALE
const round = (n) => Math.round(n * 10) / 10
const raOf = (lon) => (lon + 360) % 360
const x = (ra) => round(W - ra * SCALE)
const y = (dec) => round((BAND - dec) * SCALE)
const inBand = (dec) => Math.abs(dec) <= BAND

async function fetchCatalogue() {
  const get = async (name) => (await fetch(`${UPSTREAM}/${name}`)).json()
  const [stars, figures] = await Promise.all([get('stars.6.json'), get('constellations.lines.json')])
  const fix = (n) => Math.round(n * 100) / 100
  const catalogue = {
    source: `${UPSTREAM}/{stars.6.json,constellations.lines.json}`,
    stars: stars.features
      .map(({ properties: { mag }, geometry: { coordinates: [lon, dec] } }) => [fix(raOf(lon)), fix(dec), mag])
      .filter(([, dec, mag]) => mag <= FAINTEST && Math.abs(dec) <= BAND + 5)
      .sort((a, b) => a[2] - b[2] || a[0] - b[0]),
    figures: figures.features.flatMap(({ geometry }) => geometry.coordinates.map((line) => line.map(([lon, dec]) => [fix(raOf(lon)), fix(dec)]))),
  }
  writeFileSync(CATALOGUE, `${JSON.stringify(catalogue)}\n`)
}

/** Star radius in drawing units: a magnitude is a factor of 2.512 in light, drawn as area. */
const radius = (mag) => round(Math.max(0.7, 3.4 * 10 ** (-0.1 * (mag + 1.5))))
const alpha = (mag) => Math.round(Math.min(1, Math.max(0.45, 1.05 - 0.09 * mag)) * 100) / 100

/** A shape near the tile's edge is drawn again one tile over, so the wrap has no seam. */
const wrapped = (xs, draw) => {
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  return [draw(0), ...(lo < 8 ? [draw(W)] : []), ...(hi > W - 8 ? [draw(-W)] : [])]
}

function starsLayer(stars) {
  const byAlpha = new Map()
  for (const [ra, dec, mag] of stars) {
    if (!inBand(dec)) continue
    const cx = x(ra)
    const cy = y(dec)
    const r = radius(mag)
    const dots = wrapped([cx - r, cx + r], (shift) => `M${round(cx + shift - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`)
    const a = alpha(mag)
    byAlpha.set(a, `${byAlpha.get(a) ?? ''}${dots.join('')}`)
  }
  return [...byAlpha].sort(([a], [b]) => a - b).map(([a, d]) => `<path fill-opacity="${a}" d="${d}"/>`)
}

/** A segment crossing right ascension 0 is split into its two halves on either edge. */
function segments(line) {
  const out = []
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]]
    if (!inBand(a[1]) || !inBand(b[1])) continue
    const span = b[0] - a[0]
    const [ax, bx] = [x(a[0]), x(b[0])]
    if (Math.abs(span) <= 180) out.push(`M${ax} ${y(a[1])}L${bx} ${y(b[1])}`)
    else {
      const shift = span > 0 ? W : -W
      out.push(`M${ax} ${y(a[1])}L${round(bx + shift)} ${y(b[1])}`, `M${round(ax - shift)} ${y(a[1])}L${bx} ${y(b[1])}`)
    }
  }
  return out
}

function gridLayer() {
  const meridians = Array.from({ length: 360 / GRID.ra }, (_, i) => `M${x(i * GRID.ra)} 0V${H}`)
  const parallels = Array.from({ length: (2 * BAND) / GRID.dec + 1 }, (_, i) => -BAND + i * GRID.dec)
    .filter((dec) => dec !== 0 && Math.abs(dec) < BAND)
    .map((dec) => `M0 ${y(dec)}H${W}`)
  return [
    `<path stroke-width="0.6" stroke-opacity="0.32" d="${[...meridians, ...parallels].join('')}"/>`,
    `<path stroke-width="0.9" stroke-opacity="0.5" d="M0 ${y(0)}H${W}"/>`,
  ]
}

function eclipticLayer() {
  const tanE = Math.tan((OBLIQUITY * Math.PI) / 180)
  const points = Array.from({ length: 361 }, (_, ra) => `${x(ra)} ${y((Math.atan(Math.sin((ra * Math.PI) / 180) * tanE) * 180) / Math.PI)}`)
  return [`<path stroke-width="0.9" stroke-opacity="0.55" stroke-dasharray="6 5" d="M${points.join('L')}"/>`]
}

function pleiadesLayer() {
  const r = PLEIADES.radius * SCALE
  return [`<circle cx="${x(PLEIADES.ra)}" cy="${y(PLEIADES.dec)}" r="${r}" fill="none" stroke-width="0.8" stroke-opacity="0.7"/>`]
}

if (process.argv.includes('--fetch')) await fetchCatalogue()
const { stars, figures } = JSON.parse(readFileSync(CATALOGUE, 'utf8'))
const notice = readFileSync(LICENSE, 'utf8').trim().replaceAll('--', '- -')
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
  `<!-- Star positions and constellation figures: d3-celestial (${UPSTREAM}).\n${notice}\n-->`,
  `<g fill="none" stroke="#000" stroke-linecap="round">`,
  ...gridLayer(),
  ...eclipticLayer(),
  `<path stroke-width="0.7" stroke-opacity="0.6" d="${figures.flatMap(segments).join('')}"/>`,
  ...pleiadesLayer(),
  `</g>`,
  `<g fill="#000">`,
  ...starsLayer(stars),
  `</g>`,
  `</svg>`,
].join('\n')
writeFileSync(OUT, `${svg}\n`)
console.log(`sky.svg: ${W}×${H}, ${stars.filter(([, dec]) => inBand(dec)).length} stars, ${(svg.length / 1024).toFixed(1)} KiB`)
