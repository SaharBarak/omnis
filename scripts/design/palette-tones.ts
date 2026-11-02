/**
 * `npm run palette:tones`: solves the bento palette's layer lightness and
 * writes src/lib/design/palette-tones.gen.ts. The work lives in
 * src/lib/design/palette-tones.ts; its test fails when the committed table drifts.
 */
import { writeFileSync } from 'node:fs'
import { PALETTE_TONES_PATH, solvePaletteTones, tonesModule } from '@/lib/design/palette-tones'

writeFileSync(PALETTE_TONES_PATH, tonesModule(solvePaletteTones()))
console.log(`wrote ${PALETTE_TONES_PATH}`)
