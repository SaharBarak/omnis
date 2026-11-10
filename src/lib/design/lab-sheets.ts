import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import postcss, { list, type AtRule, type Declaration, type Node, type Root, type Rule as PostcssRule } from 'postcss'

/**
 * The lab's CSS modules and scripts, for the tests that hold them to the
 * token tables (type-scale, radius, elevation) and the motion policy. Node
 * only: tests import it, the app never does.
 */

/** The lab's trees: the bento site and bento v2 (docs/redesign/BENTO_V2.md). Token rules hold both; the motion policy holds the bento site alone. */
export const LAB_TREES = Object.freeze({
  bento: ['src/components/bento-lab', 'src/app/lab/bento'],
  v2: ['src/components/bento-v2', 'src/app/lab/bento-v2'],
} as const)

export type LabTree = keyof typeof LAB_TREES

const ALL_TREES: readonly LabTree[] = ['bento', 'v2']

/** The source roots of the given trees, relative to the repo. */
export const labRoots = (trees: readonly LabTree[] = ALL_TREES): readonly string[] => trees.flatMap((tree) => LAB_TREES[tree])

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

/** A tree root that is gone would make every policy over it pass with nothing checked, so it fails instead. */
const present = (root: string, dir: string): string => {
  if (!existsSync(join(root, dir))) throw new Error(`Lab tree root is missing: ${dir} (update LAB_TREES)`)
  return dir
}

const read = (root: string, keep: (name: string) => boolean, trees: readonly LabTree[]): readonly Sheet[] =>
  labRoots(trees)
    .map((dir) => present(root, dir))
    .flatMap((dir) => walk(join(root, dir), keep))
    .map((path) => relative(root, path))
    .filter((path) => !EXEMPT.has(path))
    .map((path) => ({ path, lines: readFileSync(join(root, path), 'utf8').split('\n') }))

export const labSheets = (root = process.cwd(), trees: readonly LabTree[] = ALL_TREES): readonly Sheet[] =>
  read(root, (name) => name.endsWith('.module.css'), trees)

/** The lab's scripts, tests left out: what reaches the browser. */
export const labScripts = (root = process.cwd(), trees: readonly LabTree[] = ALL_TREES): readonly Sheet[] =>
  read(root, (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name), trees)

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

/** An animation that runs on (`infinite`): the keyframes it names, the media queries around it and each selector of its rule. */
export interface Loop {
  readonly at: string
  readonly keyframes: string
  readonly media: readonly string[]
  readonly selectors: readonly string[]
}

const mediaAround = (node: Node): readonly string[] => {
  const found: string[] = []
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as AtRule).name === 'media') found.push((parent as AtRule).params)
  }
  return found
}

const INFINITE = /\binfinite\b/

/** The keyframes an animation item names, or '' where it names none of the sheet's. */
const named = (item: string, keyframes: ReadonlySet<string>): string => list.space(item).find((token) => keyframes.has(token)) ?? ''

/**
 * The keyframes a declaration runs on: each `infinite` item of an `animation`
 * list, or, for an `animation-iteration-count` list, each of the rule's
 * animation names whose count is `infinite` (the counts repeat to cover the names).
 */
const runsOn = (decl: Declaration, rule: PostcssRule | null, keyframes: ReadonlySet<string>): readonly string[] => {
  const items = list.comma(decl.value)
  if (decl.prop === 'animation') return items.filter((item) => INFINITE.test(item)).map((item) => named(item, keyframes))
  const naming = (rule?.nodes ?? []).filter((node): node is Declaration => node.type === 'decl' && /^animation(?:-name)?$/.test(node.prop)).at(-1)
  const names = naming ? list.comma(naming.value).map((item) => named(item, keyframes)) : ['']
  return names.filter((_, i) => INFINITE.test(items[i % items.length] ?? ''))
}

/** Every loop in the sheets (BENTO_MOTION.md "Loops"), one per keyframes run on, for the motion policy to hold to its kinds and gates. */
export function loops(sheets: readonly Sheet[]): readonly Loop[] {
  return sheets.flatMap((sheet) => {
    const root = parse(sheet)
    const keyframes = new Set<string>()
    root.walkAtRules('keyframes', (rule) => {
      keyframes.add(rule.params)
    })
    const found: Loop[] = []
    root.walkDecls(/^animation(?:-iteration-count)?$/, (decl) => {
      const rule = decl.parent?.type === 'rule' ? (decl.parent as PostcssRule) : null
      for (const name of runsOn(decl, rule, keyframes)) {
        found.push({ at: at(sheet.path, decl), keyframes: name, media: mediaAround(decl), selectors: rule?.selectors ?? [] })
      }
    })
    return found
  })
}
