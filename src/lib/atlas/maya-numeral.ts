/**
 * A Maya numeral, 0 to 19: dots for ones above bars for fives, and a shell
 * for zero. The tone mark (1 to 13) and the Long Count places (0 to 19) are
 * written with it.
 */
export interface BarDot {
  readonly bars: number
  readonly dots: number
  readonly shell: boolean
}

const BASE = 20

/** The largest number one place holds. */
export const LARGEST = BASE - 1

export function barDot(n: number): BarDot {
  if (!Number.isInteger(n) || n < 0 || n >= BASE) throw new RangeError(`A Maya numeral is 0 to ${BASE - 1}, got ${n}`)
  return { bars: Math.floor(n / 5), dots: n % 5, shell: n === 0 }
}

/** How many rows the numeral stands in: one per bar, one for the dots, one for the shell. */
export const rowsOf = ({ bars, dots, shell }: BarDot): number => (shell ? 1 : bars + (dots > 0 ? 1 : 0))
