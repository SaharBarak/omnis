/**
 * The marks a looping element carries (BENTO_MOTION.md "Loops"). Plain data,
 * so server components spread them too; `useLoops` reads them in the browser.
 */

/** A looping element: its loop runs only while `data-in-view` is on it too. */
export const LOOP = 'data-loop'

/** A status pulse: it beats in the one phase every pulse on the page shares. */
export const BEAT = 'beat'

/** Spread on an element that loops. */
export const loop = Object.freeze({ [LOOP]: '' })

/** Spread on an element whose loop is a status pulse. */
export const beat = Object.freeze({ [LOOP]: BEAT })
