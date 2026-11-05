import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import postcss, { type Declaration, type Node, type Root } from 'postcss'

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

const parse = ({ path, lines }: Sheet): Root => postcss.parse(lines.join('\n'), { from: path })

const at = (path: string, node: Node): string => `${path}:${node.source?.start?.line ?? 0}`

/** Whether a declaration carries the drawing mark: the comment right after it, on its own line. */
const drawn = (decl: Declaration): boolean => {
  const next = decl.next()
  return next?.type === 'comment' && `/* ${next.text} */` === DRAWING && next.source?.start?.line === decl.source?.start?.line
}

/** A property pattern matched against whole property names. */
const whole = (property: RegExp): RegExp => new RegExp(`^(?:${property.source})$`)

/** Every declaration in the sheets whose property matches, as `path:line` and its value, skipping those marked as drawing. */
export function declarations(sheets: readonly Sheet[], property: RegExp): readonly { readonly at: string; readonly value: string }[] {
  const matches = whole(property)
  return sheets.flatMap((sheet) => {
    const found: { at: string; value: string }[] = []
    parse(sheet).walkDecls((decl) => {
      if (matches.test(decl.prop) && !drawn(decl)) found.push({ at: at(sheet.path, decl), value: decl.value })
    })
    return found
  })
}

export interface Rule {
  /** `path:line` of the rule's selector. */
  readonly at: string
  readonly selector: string
  /** The rule's own declarations, property to value; a nested rule's are its own. */
  readonly decls: Readonly<Record<string, string>>
  /** The properties among them marked as drawing. */
  readonly drawn: ReadonlySet<string>
}

/** Every rule in a sheet, at-rules and nesting looked through, each with its own declarations. */
export function rules(sheet: Sheet): readonly Rule[] {
  const found: Rule[] = []
  parse(sheet).walkRules((rule) => {
    const own = (rule.nodes ?? []).filter((node): node is Declaration => node.type === 'decl')
    found.push({
      at: at(sheet.path, rule),
      selector: rule.selector,
      decls: Object.fromEntries(own.map((decl) => [decl.prop, decl.value])),
      drawn: new Set(own.filter(drawn).map((decl) => decl.prop)),
    })
  })
  return found
}
