import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BEARING_GLYPHS, bearingsModule, FACE_BEARINGS_PATH, hangOf, MEDIAN_BEARING, TABULAR_GLYPHS } from './face-bearings'
import { DISPLAY_BEARINGS } from './face-bearings.gen'

describe('display bearings', () => {
  it('holds every glyph a display text may start with, proportional and tabular, as the generator writes it', () => {
    expect(Object.keys(DISPLAY_BEARINGS.proportional).sort()).toEqual([...BEARING_GLYPHS].sort())
    expect(Object.keys(DISPLAY_BEARINGS.tabular).sort()).toEqual([...TABULAR_GLYPHS].sort())
    const generated = readFileSync(FACE_BEARINGS_PATH, 'utf8')
    const measuredAt = Number(generated.match(/rendered ink at (\d+) px/)![1])
    expect(generated).toBe(bearingsModule(DISPLAY_BEARINGS, measuredAt))
  })

  it('reads each bearing as a share of the em, inside the face\'s own advance', () => {
    for (const bearing of [...Object.values(DISPLAY_BEARINGS.proportional), ...Object.values(DISPLAY_BEARINGS.tabular)]) {
      expect(Math.abs(bearing)).toBeLessThan(0.25)
    }
  })
})

describe('hangOf', () => {
  it('hangs a text by its first glyph, past any leading space', () => {
    expect(hangOf('One map')).toBe(DISPLAY_BEARINGS.proportional.O)
    expect(hangOf('  Your circle')).toBe(DISPLAY_BEARINGS.proportional.Y)
    expect(hangOf('Y')).not.toBe(hangOf('b'))
  })

  it('reads a digit from the tabular table where the figures are tabular', () => {
    expect(hangOf('164', 'tabular')).toBe(DISPLAY_BEARINGS.tabular['1'])
    expect(hangOf('164')).toBe(DISPLAY_BEARINGS.proportional['1'])
    expect(hangOf('Kin', 'tabular')).toBe(DISPLAY_BEARINGS.proportional.K)
  })

  it('stands the face\'s median in for a glyph the table does not hold', () => {
    expect(hangOf('“Quoted”')).toBe(MEDIAN_BEARING)
    expect(hangOf('')).toBe(MEDIAN_BEARING)
  })
})
