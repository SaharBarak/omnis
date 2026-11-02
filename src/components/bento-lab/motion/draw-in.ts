import type { IllustrationKit } from './use-illustration'
import { CURVE, DURATION } from '@/lib/design/motion-tokens'

/**
 * A stroke drawing itself with anime.js (BENTO_MOTION.md "Illustration").
 * Every line it draws has `pathLength` 1, so the undrawn state is one dash
 * with a gap twice as long, pushed just past the start: nothing drawn and no
 * round cap showing.
 */
const UNDRAWN = 1.01

/**
 * Set before the draw; reverting the scope removes it. A fresh object each
 * call, because anime.js writes its own keys into the params it is handed.
 */
export const undrawnStroke = () => ({ strokeDasharray: '1 2', strokeDashoffset: UNDRAWN })

/** Share of a draw at which the line's far end, label or the next beat lands. */
const ARRIVE = 0.75

/** The draw itself: undrawn to whole over the draw token, landing with weight. */
export const drawStroke = (ease: IllustrationKit['ease']) => ({ strokeDashoffset: [UNDRAWN, 0], duration: DURATION.draw, ease: ease(CURVE.emphasized) })

/** When a draw that starts at `at` (ms) lands. */
export const landsAt = (at: number): number => at + DURATION.draw * ARRIVE
