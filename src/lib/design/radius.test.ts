import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { declarations, labSheets } from './lab-sheets'
import { EDGE_WIDTH, FRAME_RIM, RADII, RADIUS, concentric, radiusCssVars } from './radius'

describe('the radius roles', () => {
  it('rise from the smallest role to the frame', () => {
    const values = Object.values(RADII)
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(new Set(values).size).toBe(values.length)
  })

  it('derive the frame from the stage it holds, edge included', () => {
    expect(RADII.frame).toBe(RADIUS.stage + FRAME_RIM + EDGE_WIDTH)
    expect(concentric(RADIUS.card, 12)).toBe(RADIUS.card + 12 + EDGE_WIDTH)
  })

  it('emits every role and the edge and rim it derives from', () => {
    const vars = radiusCssVars()
    for (const [role, px] of Object.entries(RADII)) expect(vars[`--radius-${role}`]).toBe(`${px}px`)
    expect(vars['--edge-w']).toBe(`${EDGE_WIDTH}px`)
    expect(vars['--frame-rim']).toBe(`${FRAME_RIM}px`)
  })
})

/*
 * Every radius in the lab is a role, a derivation from tokens, or a shape
 * (docs/redesign/BENTO_POLISH.md, "Radius"). A mark inside a drawing is
 * marked as drawing.
 */
const SHAPES = new Set(['0', '50%', '999px', 'inherit'])
const TOKEN = /var\(--[a-z0-9-]+\)/g
/** A `calc()` of tokens, operators and unitless factors only: no raw length inside it. */
const DERIVED = /calc\([\sT\d.+\-*/]*\)/g

const allowed = (value: string): boolean =>
  value
    .replace(TOKEN, 'T')
    .replace(DERIVED, 'T')
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => part === 'T' || SHAPES.has(part))

describe('lab CSS takes its radii from the roles', () => {
  const sheets = labSheets()

  it('has no radius outside the roles', () => {
    const strays = declarations(sheets, /border(?:-[a-z]+)*-radius/)
      .filter(({ value }) => !allowed(value))
      .map(({ at, value }) => `${at} ${value}`)
    expect(strays).toEqual([])
  })

  it('rounds clip paths and radius variables with the roles too', () => {
    const clips = declarations(sheets, /clip-path/)
      .flatMap(({ at, value }) => {
        const round = /\bround\s+(.*)\)\s*$/.exec(value)?.[1]?.trim()
        return round === undefined ? [] : [{ at, value: round }]
      })
      .filter(({ value }) => !allowed(value))
    const variables = declarations(sheets, /--[a-z0-9-]*(?:-r|radius)/)
      .filter(({ value }) => !allowed(value))
    expect([...clips, ...variables].map(({ at, value }) => `${at} ${value}`)).toEqual([])
  })

  it('sets no inline radius in the kit or the pages', () => {
    const roots = ['src/components/bento-lab', 'src/app/lab/bento']
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === 'wireframes' || entry.name === 'wireframe' ? [] : walk(path)
        return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
      })
    const strays = roots
      .flatMap((dir) => walk(join(process.cwd(), dir)))
      .flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .flatMap((line, index) => (/borderRadius:\s*['"]?\d/.test(line) ? [`${relative(process.cwd(), path)}:${index + 1}`] : [])),
      )
    expect(strays).toEqual([])
  })
})
