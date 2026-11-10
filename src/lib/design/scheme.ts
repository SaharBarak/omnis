import { elevationCssVars } from './elevation'
import { CHAPTERS } from './palette-ids'
import { THEMES, schemeOf, type Theme } from './palette-spec'
import { markDecls } from '@/lib/brand/mark'
import { MARK_TONES } from '@/lib/brand/mark-tones.gen'

type Decls = readonly (readonly [string, string])[]

/**
 * A scheme is what follows the theme a palette is resolved in rather than the
 * palette's colours (BENTO_COLOR.md "Inverse sections"): the mark's tones, the
 * elevation scale, `color-scheme`, and the theme-dependent values components
 * read as variables instead of `[data-theme]` selectors, so an inverse
 * chapter's glyphs, glass and textures follow it. Every alias that mixes
 * palette variables is declared here too, because a custom property resolves
 * where it is declared and inherits as a value: a chapter has to declare it
 * again.
 */
export const SCHEME_VARS: Readonly<Record<Theme, Readonly<Record<string, string>>>> = Object.freeze({
  dark: {
    '--lab-glass': 'color-mix(in srgb, var(--surface-2) 64%, transparent)',
    '--field-alpha': '0.16',
    /* Glyph art is drawn black; on a night ground it is inverted to read light. */
    '--glyph-filter': 'invert(1)',
    '--atlas-glyph-alpha': '0.86',
    '--layers-field-strength': '1.6',
    '--layers-plate-edge': '55%',
  },
  light: {
    '--lab-glass': 'color-mix(in srgb, var(--lab-surface) 68%, transparent)',
    '--field-alpha': '0.2',
    '--glyph-filter': 'none',
    '--atlas-glyph-alpha': '0.72',
    '--layers-field-strength': '0.8',
    '--layers-plate-edge': '85%',
  },
})

/** What only the lab root reads: the grain is one fixed layer over the whole page, in the page's scheme. */
export const PAGE_VARS: Readonly<Record<Theme, Readonly<Record<string, string>>>> = Object.freeze({
  dark: { '--grain': '0.06' },
  light: { '--grain': '0.05' },
})

/** Aliases over palette variables that read the same in either scheme. */
const PALETTE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  '--lab-highlight':
    'linear-gradient(100deg, color-mix(in srgb, var(--brand) 55%, transparent) 0%, color-mix(in srgb, var(--layer-kin) 40%, transparent) 55%, color-mix(in srgb, var(--layer-sky) 40%, transparent) 100%)',
})

/** Everything one scheme declares, on the root or on a chapter. */
export const schemeDecls = (theme: Theme): Decls => [
  ...Object.entries(SCHEME_VARS[theme]),
  ...Object.entries(PALETTE_ALIASES),
  ...Object.entries(elevationCssVars(theme)),
  ...markDecls(MARK_TONES, theme),
  ['color-scheme', theme],
]

const block = (selector: string, decls: Decls): string => `${selector}{${decls.map(([k, v]) => `${k}:${v}`).join(';')}}`

/**
 * The stylesheet for every theme on `root` (an element carrying
 * `data-theme`), and for every chapter inside it, in the chapter's scheme.
 * Chapters do not nest: a chapter inside a chapter keeps the outer one's.
 */
export const schemeCss = (root: string): string =>
  THEMES.flatMap((theme) => [
    block(`${root}[data-theme="${theme}"]`, [...schemeDecls(theme), ...Object.entries(PAGE_VARS[theme])]),
    ...CHAPTERS.map((chapter) => block(`${root}[data-theme="${theme}"] [data-chapter="${chapter}"]`, schemeDecls(schemeOf(theme, chapter)))),
  ]).join('')
