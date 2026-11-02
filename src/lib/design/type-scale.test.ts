import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TYPE_SCALE, TYPE_STEPS, isText, roleSet, sizeAt, stepSize, typeCssVars, type TypeRole } from './type-scale'

const ROLES = (Object.keys(TYPE_STEPS) as TypeRole[]).sort((a, b) => TYPE_STEPS[a] - TYPE_STEPS[b])
const WIDTHS = [320, TYPE_SCALE.narrow.width, 390, 768, 1100, TYPE_SCALE.wide.width, 1920]

describe('the type scale', () => {
  it('rises with every step at every width', () => {
    for (const width of WIDTHS) {
      const sizes = ROLES.map((role) => sizeAt(stepSize(TYPE_STEPS[role]), width))
      expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
      expect(new Set(sizes).size).toBe(sizes.length)
    }
  })

  it('never resolves below 11 px, the smallest text Apple sets', () => {
    for (const width of WIDTHS) for (const role of ROLES) expect(sizeAt(stepSize(TYPE_STEPS[role]), width)).toBeGreaterThanOrEqual(11)
  })

  it('holds small text fixed and lets only headings grow with the window', () => {
    for (const role of ROLES) {
      const [narrow, wide] = [TYPE_SCALE.narrow.width, TYPE_SCALE.wide.width].map((w) => sizeAt(stepSize(TYPE_STEPS[role]), w))
      if (TYPE_STEPS[role] <= 0) expect(wide).toBe(narrow)
      else expect(wide).toBeGreaterThan(narrow!)
    }
  })

  it('sets larger type tighter: leading and tracking fall as size rises', () => {
    const headings = ROLES.filter((role) => !isText(role))
    const leading = headings.map((role) => roleSet(role).leading)
    expect(leading).toEqual([...leading].sort((a, b) => b - a))
    const tracking = ROLES.map((role) => roleSet(role).tracking)
    expect(tracking).toEqual([...tracking].sort((a, b) => b - a))
    for (const role of ROLES.filter(isText)) expect(roleSet(role).leading).toBe(TYPE_SCALE.set.text.leading)
  })

  it('emits a size, leading and tracking for every role', () => {
    const vars = typeCssVars()
    for (const role of ROLES) for (const suffix of ['', '-lh', '-ls']) expect(vars[`--type-${role}${suffix}`]).toBeTruthy()
  })
})

/* Every font size in the lab is a role (docs/redesign/BENTO_TYPE.md, "Custom properties"). */
const ROOTS = ['src/components/bento-lab', 'src/app/lab/bento']
/** Drawing units in page miniatures, not type read at that size. */
const EXEMPT = new Set(['src/components/bento-lab/wireframe/wireframe.module.css'])
/** Marks SVG text placed in viewBox units: drawing, not type (BENTO_TYPE.md). */
const DRAWING = '/* drawing */'
const ALLOWED = /^(var\(--type-[a-z]+\)|inherit|-?\d*\.?\d+em|calc\(.*var\(--type-[a-z]+\).*\))$/

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.module.css') ? [path] : []
  })

describe('lab CSS takes its sizes from the scale', () => {
  const root = process.cwd()
  const sheets = ROOTS.flatMap((dir) => walk(join(root, dir))).map((path) => relative(root, path)).filter((path) => !EXEMPT.has(path))

  it('finds the sheets', () => {
    expect(sheets.length).toBeGreaterThan(5)
  })

  it('has no font size outside the scale', () => {
    const strays = sheets.flatMap((path) =>
      readFileSync(join(root, path), 'utf8')
        .split('\n')
        .flatMap((line, index) => {
          if (line.includes(DRAWING)) return []
          const size = /(?:^|[\s;{])font-size\s*:\s*([^;]+);/.exec(line)?.[1]?.trim()
          const shorthand = /(?:^|[\s;{])font\s*:\s*([^;]+);/.exec(line)?.[1]?.trim()
          if (size !== undefined && !ALLOWED.test(size)) return [`${path}:${index + 1} font-size: ${size}`]
          if (shorthand !== undefined && shorthand !== 'inherit') return [`${path}:${index + 1} font: ${shorthand}`]
          return []
        }),
    )
    expect(strays).toEqual([])
  })
})
