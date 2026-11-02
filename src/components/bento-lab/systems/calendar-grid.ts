import { dateToKin, kinToSeal } from '@pleiad/engine/calculations/dreamspell'

export interface DayCell {
  readonly iso: string
  readonly day: number
  readonly kin: number
  readonly seal: number
  readonly inMonth: boolean
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** Month and year of a YYYY-MM-DD date, month 0-11. */
export const monthOf = (iso: string): { readonly year: number; readonly month: number } => ({
  year: Number(iso.slice(0, 4)),
  month: Number(iso.slice(5, 7)) - 1,
})

export const shiftMonth = (m: { readonly year: number; readonly month: number }, delta: number) => {
  const total = m.year * 12 + m.month + delta
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

/**
 * Sunday-first weeks covering the month, each day with its kin. A trailing
 * week that holds no day of the month is dropped, so most months fill five rows.
 */
export function monthGrid(year: number, month: number): readonly DayCell[] {
  const first = new Date(Date.UTC(year, month, 1))
  const start = Date.UTC(year, month, 1 - first.getUTCDay())
  const cells = Array.from({ length: 42 }, (_, i): DayCell => {
    const d = new Date(start + i * 86_400_000)
    const iso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    const kin = dateToKin(iso)
    return { iso, day: d.getUTCDate(), kin, seal: kinToSeal(kin), inMonth: d.getUTCMonth() === month }
  })
  return cells.slice(35).every((c) => !c.inMonth) ? cells.slice(0, 35) : cells
}
