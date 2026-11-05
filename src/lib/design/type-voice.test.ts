import { describe, expect, it } from 'vitest'
import { declarations, labSheets, rules, type Sheet } from './lab-sheets'
import { FACES, LEVEL_CONTRAST, TRIM, TYPE_SCALE, TYPE_STEPS, groupPx, sizeAt, stepSize, type TypeRole } from './type-scale'
import { TYPE_VOICES, contrastFaults, holdsContrast, voiceCssVars, type TypeVoice } from './type-voice'

const WIDTHS = [320, TYPE_SCALE.narrow.width, 390, 768, 1100, TYPE_SCALE.wide.width, 1920]
const VOICES = Object.entries(TYPE_VOICES) as [string, TypeVoice][]

describe('the contrast rule', () => {
  it('passes one size, and two steps on the dense end, but never one', () => {
    expect(holdsContrast('caption', 'caption', 390)).toBe(true)
    expect(holdsContrast('body', 'caption', 390)).toBe(true)
    expect(holdsContrast('small', 'caption', 390)).toBe(false)
    expect(holdsContrast('body', 'small', 390)).toBe(false)
  })

  it('is the open end of the scale', () => {
    expect(LEVEL_CONTRAST).toBe(TYPE_SCALE.wide.ratio)
  })
})

describe('trimmed lines', () => {
  it('serve both faces with one cap height', () => {
    expect(FACES.text.capHeight).toBe(FACES.display.capHeight)
    expect(TRIM.room).toBeCloseTo(1 - TRIM.cap)
  })
})

describe('voiced sheets', () => {
  it('are the only sheets that read voice levels', () => {
    const voiced = new Set(VOICES.map(([, voice]) => voice.sheet))
    const readers = labSheets().filter(({ path, lines }) => !voiced.has(path) && lines.some((line) => line.includes('var(--voice-')))
    expect(readers.map(({ path }) => path)).toEqual([])
  })
})

describe.each(VOICES)('the %s voice', (_, voice) => {
  const sheet = labSheets().find(({ path }) => path === voice.sheet) as Sheet | undefined

  it('holds every pair to the contrast rule at every width', () => {
    expect(contrastFaults(voice, WIDTHS)).toEqual([])
  })

  it('emits a size, leading and tracking for every level', () => {
    const vars = voiceCssVars(voice)
    for (const level of Object.keys(voice.levels)) for (const suffix of ['', '-lh', '-ls']) expect(vars[`--voice-${level}${suffix}`]).toBeTruthy()
  })

  it('names a lab sheet', () => {
    expect(sheet).toBeDefined()
  })

  it('takes every font size in its sheet from its levels, and uses them all', () => {
    if (!sheet) return
    const levels = new Set(Object.keys(voice.levels))
    const sizes = declarations([sheet], /font-size/)
    const used = new Set(sizes.flatMap(({ value }) => [...value.matchAll(/var\(--voice-([a-z]+)\)/g)].map((m) => m[1]!)))
    const strays = sizes.filter(({ value }) => !/^(inherit|-?\d*\.?\d+em)$/.test(value) && !levels.has(/^var\(--voice-([a-z]+)\)$/.exec(value)?.[1] ?? ''))
    expect(strays.map(({ at, value }) => `${at} font-size: ${value}`)).toEqual([])
    expect([...levels].filter((level) => !used.has(level))).toEqual([])
  })

  it('sets its parts further apart than the lines of any fact', () => {
    const paired = [...new Set(voice.pairs.flat())].map((level) => voice.levels[level]!)
    for (const width of WIDTHS) {
      const widestPair = Math.max(...paired.map((role) => TRIM.room * sizeAt(stepSize(TYPE_STEPS[role]), width)))
      expect(groupPx(), `at ${width}px`).toBeGreaterThan(widestPair)
    }
  })

  it('leaves its levels to the table: the sheet never defines them', () => {
    if (!sheet) return
    expect(declarations([sheet], /--voice-[a-z-]+/).map(({ at }) => at)).toEqual([])
  })
})

/** Rules that set the display face below the figure: each leaves this list as its component takes a voice. */
const DISPLAY_IN_TEXT = new Set([
  'src/components/bento-lab/app/app.module.css .avatar',
  'src/components/bento-lab/atlas/atlas.module.css .cardValue',
  'src/components/bento-lab/blocks/blocks.module.css .odds',
  'src/components/bento-lab/blocks/blocks.module.css .plain',
  'src/components/bento-lab/docs/docs.module.css .neighbourTitle',
  'src/components/bento-lab/docs/docs.module.css .recordTitle',
  'src/components/bento-lab/docs/docs.module.css .sectionTitle',
  'src/components/bento-lab/docs/docs.module.css .tileName',
  'src/components/bento-lab/people/people.module.css .panelTitle',
  'src/components/bento-lab/scenes/circle.module.css .bits',
  'src/components/bento-lab/site/site.module.css .brand',
  'src/components/bento-lab/site/site.module.css .h3',
  'src/components/bento-lab/site/site.module.css .primary',
  'src/components/bento-lab/systems/systems.module.css .cellBig',
  'src/components/bento-lab/systems/systems.module.css .draw strong',
  'src/components/bento-lab/systems/systems.module.css .systemTileLabel',
])

const ROLE_OF_VOICE = new Map(VOICES.map(([, voice]) => [voice.sheet, voice.levels as Readonly<Record<string, TypeRole>>]))

/** The role a font size names: a role directly, or a voice level of the sheet. */
const roleOf = (sheet: string, value: string): TypeRole | null => {
  const role = /var\(--type-([a-z]+)\)/.exec(value)?.[1]
  if (role && role in TYPE_STEPS) return role as TypeRole
  const level = /var\(--voice-([a-z]+)\)/.exec(value)?.[1]
  return (level && ROLE_OF_VOICE.get(sheet)?.[level]) || null
}

describe('faces follow roles', () => {
  const sheets = labSheets()
  const displayInText = sheets.flatMap((sheet) =>
    rules(sheet)
      .filter(({ decls }) => /var\(--font-display\)/.test(decls['font-family'] ?? ''))
      .flatMap(({ selector, decls }) => {
        const role = roleOf(sheet.path, decls['font-size'] ?? '')
        return role && TYPE_STEPS[role] < TYPE_STEPS.figure ? [`${sheet.path} ${selector}`] : []
      }),
  )

  it('sets nothing below the figure in the display face outside the list', () => {
    expect(displayInText.filter((at) => !DISPLAY_IN_TEXT.has(at))).toEqual([])
  })

  it('keeps the list to rules that still break it', () => {
    expect([...DISPLAY_IN_TEXT].filter((at) => !displayInText.includes(at))).toEqual([])
  })
})
