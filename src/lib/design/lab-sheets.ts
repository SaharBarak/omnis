import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The lab's CSS modules, for the tests that hold them to the token tables
 * (type-scale, radius, elevation). Node only: tests import it, the app never
 * does.
 */

const ROOTS = ['src/components/bento-lab', 'src/app/lab/bento']

/** Page miniatures: their sizes and radii are drawing units, not the page's. */
const EXEMPT = new Set(['src/components/bento-lab/wireframe/wireframe.module.css'])

/** Marks a declaration that belongs to a drawing (SVG text in viewBox units, a mark's cap), not to the page's scale. */
export const DRAWING = '/* drawing */'

export interface Sheet {
  readonly path: string
  readonly lines: readonly string[]
}

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.module.css') ? [path] : []
  })

export function labSheets(root = process.cwd()): readonly Sheet[] {
  return ROOTS.flatMap((dir) => walk(join(root, dir)))
    .map((path) => relative(root, path))
    .filter((path) => !EXEMPT.has(path))
    .map((path) => ({ path, lines: readFileSync(join(root, path), 'utf8').split('\n') }))
}

/** Every `property: value;` in the sheets whose property matches, as `path:line value`, skipping lines marked as drawing. */
export function declarations(sheets: readonly Sheet[], property: RegExp): readonly { readonly at: string; readonly value: string }[] {
  const pattern = new RegExp(`(?:^|[\\s;{])(${property.source})\\s*:\\s*([^;]+);`)
  return sheets.flatMap(({ path, lines }) =>
    lines.flatMap((line, index) => {
      if (line.includes(DRAWING)) return []
      const value = pattern.exec(line)?.[2]?.trim()
      return value === undefined ? [] : [{ at: `${path}:${index + 1}`, value }]
    }),
  )
}
