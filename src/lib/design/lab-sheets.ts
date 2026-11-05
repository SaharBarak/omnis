import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The lab's CSS modules and scripts, for the tests that hold them to the
 * token tables (type-scale, radius, elevation) and the motion policy. Node
 * only: tests import it, the app never does.
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

const walk = (dir: string, keep: (name: string) => boolean): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path, keep) : keep(entry.name) ? [path] : []
  })

const read = (root: string, keep: (name: string) => boolean): readonly Sheet[] =>
  ROOTS.flatMap((dir) => walk(join(root, dir), keep))
    .map((path) => relative(root, path))
    .filter((path) => !EXEMPT.has(path))
    .map((path) => ({ path, lines: readFileSync(join(root, path), 'utf8').split('\n') }))

export const labSheets = (root = process.cwd()): readonly Sheet[] => read(root, (name) => name.endsWith('.module.css'))

/** The lab's scripts, tests left out: what reaches the browser. */
export const labScripts = (root = process.cwd()): readonly Sheet[] => read(root, (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))

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

export interface Rule {
  /** `path:line` of the rule's selector. */
  readonly at: string
  readonly selector: string
  /** The rule's own declarations, property to value, comments left out. */
  readonly decls: Readonly<Record<string, string>>
}

/** Every innermost rule in a sheet (a selector and its declarations), at-rule wrappers looked through. */
export function rules({ path, lines }: Sheet): readonly Rule[] {
  const text = lines.join('\n').replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
  const found: Rule[] = []
  for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const head = match[1]!
    const selector = head.trim()
    if (selector.startsWith('@')) continue
    const line = text.slice(0, match.index! + head.length - head.trimStart().length).split('\n').length
    const decls = Object.fromEntries(
      match[2]!
        .split(';')
        .map((decl) => decl.split(/:(.*)/s).map((part) => part.trim()))
        .filter((pair): pair is [string, string] => pair.length >= 2 && pair[0] !== '' && pair[1] !== undefined && pair[1] !== ''),
    )
    found.push({ at: `${path}:${line}`, selector, decls })
  }
  return found
}
