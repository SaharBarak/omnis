import {
  birthdayNumber,
  expressionNumber,
  lifePathNumber,
  personalYearNumber,
  soulUrgeNumber,
} from '@pleiad/engine/calculations/numerology'
import type { NumberLayer } from './types'

/** Pythagorean core numbers. Light. `today` is ISO, for the personal year. */
export function buildNumber(date: string, name: string | null, today: string): NumberLayer {
  return {
    lifePath: lifePathNumber(date),
    birthday: birthdayNumber(date),
    expression: name ? expressionNumber(name) : null,
    soulUrge: name ? soulUrgeNumber(name) : null,
    personalYear: personalYearNumber(date, today),
  }
}
