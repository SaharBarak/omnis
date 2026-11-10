import { describe, expect, it } from 'vitest'
import { elevationCssVars, LEVELS } from './elevation'
import { CHAPTERS } from './palette-ids'
import { THEMES, schemeOf } from './palette-spec'
import { PAGE_VARS, SCHEME_VARS, schemeCss, schemeDecls } from './scheme'
import { MARK_PARTS, MARK_VARS } from '@/lib/brand/mark'
import { MARK_TONES } from '@/lib/brand/mark-tones.gen'

const ruleOf = (css: string, selector: string): string => {
  const start = css.indexOf(`${selector}{`)
  return start < 0 ? '' : css.slice(start + selector.length + 1, css.indexOf('}', start))
}

const declsOf = (decls: readonly (readonly [string, string])[]): string => decls.map(([k, v]) => `${k}:${v}`).join(';')

describe('the scheme sheet (BENTO_COLOR.md "Inverse sections")', () => {
  const css = schemeCss('[data-lab]')

  it('gives every theme its scheme, its elevation, its mark and its color-scheme', () => {
    for (const theme of THEMES) {
      const decls = Object.fromEntries(schemeDecls(theme))
      for (const level of LEVELS) expect(decls[`--elevation-${level}`]).toBe(elevationCssVars(theme)[`--elevation-${level}`])
      for (const part of MARK_PARTS) expect(decls[MARK_VARS[part]]).toBe(MARK_TONES[theme][part])
      for (const [name, value] of Object.entries(SCHEME_VARS[theme])) expect(decls[name]).toBe(value)
      expect(decls['color-scheme']).toBe(theme)
    }
  })

  it('writes the page grain on the root only', () => {
    for (const theme of THEMES) {
      expect(ruleOf(css, `[data-lab][data-theme="${theme}"]`)).toBe(declsOf([...schemeDecls(theme), ...Object.entries(PAGE_VARS[theme])]))
      for (const chapter of CHAPTERS) expect(ruleOf(css, `[data-lab][data-theme="${theme}"] [data-chapter="${chapter}"]`)).not.toContain('--grain')
    }
  })

  it('declares every chapter in the scheme it is resolved in', () => {
    for (const theme of THEMES) {
      for (const chapter of CHAPTERS) {
        expect(ruleOf(css, `[data-lab][data-theme="${theme}"] [data-chapter="${chapter}"]`)).toBe(declsOf(schemeDecls(schemeOf(theme, chapter))))
      }
    }
  })

  it('keeps both themes on the same variables, so no value is left over from the other', () => {
    expect(Object.keys(SCHEME_VARS.dark).sort()).toEqual(Object.keys(SCHEME_VARS.light).sort())
    expect(Object.keys(PAGE_VARS.dark).sort()).toEqual(Object.keys(PAGE_VARS.light).sort())
  })
})
