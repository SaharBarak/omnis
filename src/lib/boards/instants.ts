import { daysFrom } from '@pleiad/engine/calculations/day-search'
import type { Instant } from '@pleiad/engine/calculations/sky-events'
import { event } from './parts'
import type { BoardEvent, BoardMark } from './types'
import { dayWords } from './words'

/**
 * The sky's instants as a board says them (BENTO_BOARDS.md "Sun", "Moon"):
 * the time in UTC to the minute, as the almanacs give it, and the day too
 * where the cell that holds it is another (a noon-ruled cell holds what
 * falls after the noon before it). Server only.
 */

const KM = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

/** "07:24 UTC". */
export const utcWords = (instant: Instant): string => `${instant.time} UTC`

/** "Sun 22 Nov 07:24 UTC". */
export const atWords = (instant: Instant): string => `${dayWords(instant.date)} ${utcWords(instant)}`

/** "Sun enters Sagittarius, 07:24 UTC", the day before the time where the instant falls on a day other than `cell` (or no cell is named). */
export const instantWords = (name: string, instant: Instant, cell?: string): string => `${name}, ${cell === instant.date ? utcWords(instant) : atWords(instant)}`

/** "405,608 km". */
export const kmWords = (km: number): string => `${KM.format(km)} km`

/** An event at an instant, dated by its UTC day from `day`, with its mark and the view and cell it falls on. */
export const instantEvent = (name: string, instant: Instant, day: string, mark?: BoardMark, at?: BoardEvent['at']): BoardEvent =>
  event(name, { date: instant.date, inDays: daysFrom(day, instant.date) }, mark, at)
