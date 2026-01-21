import { asSeal, asTone, type SealNumber, type ToneNumber } from '../../core/types.ts'
import { gregorianToJDN, parseDate } from './julian.ts'
import type { TzolkinDay } from '../types/tzolkin.ts'
import { getTzolkinSign } from '../data/tzolkin-signs.ts'

// GMT correlation constant
const GMT_CORRELATION = 584283

export function dateToTzolkin(dateStr: string): TzolkinDay {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)

  // Calculate day sign (1-20)
  // Offset calibrated so 2012-12-21 = 4 Ajaw (sign 20)
  let daySignNumber = (jdn - GMT_CORRELATION + 20) % 20
  if (daySignNumber === 0) daySignNumber = 20

  // Calculate tone (1-13)
  let tone = (jdn - GMT_CORRELATION + 4) % 13
  if (tone === 0) tone = 13

  return {
    daySign: getTzolkinSign(daySignNumber),
    tone,
  }
}

export function getTzolkinSealNumber(dateStr: string): SealNumber {
  const { daySign } = dateToTzolkin(dateStr)
  return asSeal(daySign.number)
}

export function getTzolkinTone(dateStr: string): ToneNumber {
  const { tone } = dateToTzolkin(dateStr)
  return asTone(tone)
}
