import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PALETTE_TONES_PATH, solvePaletteTones, tonesModule } from './palette-tones'

describe('the generated layer tones: a palette change without `npm run palette:tones` fails here', () => {
  it('match a fresh solve', () => {
    expect(readFileSync(join(process.cwd(), PALETTE_TONES_PATH), 'utf8')).toBe(tonesModule(solvePaletteTones()))
  })
})
