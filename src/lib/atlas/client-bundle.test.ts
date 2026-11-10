import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { labRoots } from '@/lib/design/lab-sheets'

/**
 * Packages that must reach the browser only through a dynamic `import()`:
 * the heavy engine's two ephemeris packages (through load.ts), and the
 * sequence and illustration engine (through useSequence, useIllustration and useTurn,
 * docs/redesign/BENTO_MOTION.md "Policy"); and local modules held back the
 * same way, such as the atlas mark meanings (through useExplain). This walks the static import
 * graph of every client module in the bento tree and fails if one of them
 * reaches one of these packages.
 */

const ROOT = process.cwd()
/** Bento v2's scroll engines load the same way, through ScrollEngine (docs/redesign/BENTO_V2.md "Motion engines"). */
const HEAVY = new Set(['circular-natal-horoscope-js', 'astronomy-engine', 'animejs', 'gsap', 'lenis'])
/**
 * Local modules that reach the browser only after first paint: the atlas mark
 * meanings and the long tables only they read (BENTO_SITE.md, "Marks explain themselves",
 * "Facts explain themselves").
 */
const LAZY_FILES = new Set(
  [
    'src/lib/atlas/explain.ts',
    'src/lib/dreamspell-meanings.ts',
    'packages/engine/src/data/human-design-gates.ts',
    'packages/engine/src/data/wavespells.ts',
    'packages/engine/src/data/castles.ts',
    'packages/engine/src/data/human-design.ts',
  ].map((f) => join(ROOT, f)),
)
const CLIENT_ROOTS = labRoots().map((d) => join(ROOT, d))
const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx']

const walk = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const isClient = (file: string): boolean => /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8'))

/** Static value imports and re-exports; type-only ones and dynamic `import()` are skipped. */
const STATIC = /^\s*(import|export)\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm

const valueSpecifiers = (clause: string): boolean => {
  const inner = clause.match(/\{([\s\S]*)\}/)?.[1]
  const outside = clause.replace(/\{[\s\S]*\}/, '').replace(/[,\s]/g, '')
  if (outside.length > 0) return true
  if (inner === undefined) return true
  return inner.split(',').some((s) => s.trim() !== '' && !/^type\s/.test(s.trim()))
}

const resolveFile = (base: string): string | null => {
  if (existsSync(base) && statSync(base).isFile()) return base
  return EXTENSIONS.map((ext) => base + ext).find((p) => existsSync(p)) ?? null
}

type Target = { readonly file: string } | { readonly pkg: string } | null

const target = (from: string, spec: string): Target => {
  if (spec.startsWith('.')) return { file: resolveFile(resolve(dirname(from), spec)) ?? '' }
  if (spec.startsWith('@/')) return { file: resolveFile(join(ROOT, 'src', spec.slice(2))) ?? '' }
  if (spec === '@pleiad/engine') return { file: join(ROOT, 'packages/engine/src/index.ts') }
  if (spec.startsWith('@pleiad/engine/')) return { file: resolveFile(join(ROOT, 'packages/engine/src', spec.slice(15))) ?? '' }
  if (/\.(css|svg|png|webp|json)$/.test(spec)) return null
  return { pkg: spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0] }
}

/** The first chain of files from `entry` to a heavy package, or null. */
function heavyPath(entry: string): readonly string[] | null {
  const seen = new Set<string>()
  const queue: (readonly string[])[] = [[entry]]
  while (queue.length > 0) {
    const chain = queue.shift()!
    const file = chain[chain.length - 1]
    if (seen.has(file) || !file || !/\.tsx?$/.test(file)) continue
    seen.add(file)
    for (const m of readFileSync(file, 'utf8').matchAll(STATIC)) {
      if (m[2]) continue
      if (m[3] !== undefined && !valueSpecifiers(m[3])) continue
      const next = target(file, m[4] ?? m[5])
      if (!next) continue
      if ('pkg' in next) {
        if (HEAVY.has(next.pkg)) return [...chain, next.pkg]
        continue
      }
      if (next.file && LAZY_FILES.has(next.file)) return [...chain, next.file]
      if (next.file) queue.push([...chain, next.file])
    }
  }
  return null
}

describe('client bundle boundary', () => {
  const clients = CLIENT_ROOTS.flatMap(walk).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.') && isClient(f))

  it('finds the client modules it guards', () => {
    expect(clients.length).toBeGreaterThan(10)
  })

  it('keeps the ephemeris and motion engines, and the mark meanings, out of every static client import graph', () => {
    const leaks = clients
      .map((f) => heavyPath(f))
      .filter((p): p is readonly string[] => p !== null)
      .map((p) => p.map((f) => (f.startsWith(ROOT) ? relative(ROOT, f) : f)).join(' -> '))
    expect(leaks).toEqual([])
  })
})
