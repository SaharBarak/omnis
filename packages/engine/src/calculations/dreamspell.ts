import { asKin, asSeal, asTone, type Kin, type SealNumber, type ToneNumber } from '../core/types'
import { isLeapYear, gregorianToJDN, parseDate } from './julian'

// Epoch: July 26, 1987 = Kin 34 (White Galactic Wizard)
const EPOCH_YEAR = 1987
const EPOCH_MONTH = 7
const EPOCH_DAY = 26
const EPOCH_KIN = 34
const EPOCH_JDN = gregorianToJDN(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY)

function countLeapDaysInRange(startJdn: number, endJdn: number, startYear: number, endYear: number): number {
  let count = 0

  // Check each year for Feb 29
  for (let y = startYear; y <= endYear; y++) {
    if (isLeapYear(y)) {
      const feb29Jdn = gregorianToJDN(y, 2, 29)
      // Feb 29 is skipped if it falls within (start, end] - after start but not after end
      if (feb29Jdn > startJdn && feb29Jdn <= endJdn) {
        count++
      }
    }
  }

  return count
}

export function dateToKin(dateStr: string): Kin {
  const { year, month, day } = parseDate(dateStr)

  // If target date IS Feb 29, treat it same as Feb 28 (leap day is skipped)
  if (month === 2 && day === 29) {
    return dateToKin(`${year}-02-28`)
  }

  const targetJdn = gregorianToJDN(year, month, day)

  if (targetJdn >= EPOCH_JDN) {
    // Forward from epoch
    const days = targetJdn - EPOCH_JDN
    const leapDaysSkipped = countLeapDaysInRange(EPOCH_JDN, targetJdn, EPOCH_YEAR, year)
    const adjustedDays = days - leapDaysSkipped
    const kin = ((EPOCH_KIN - 1 + adjustedDays) % 260) + 1
    return asKin(kin)
  } else {
    // Backward from epoch
    const days = EPOCH_JDN - targetJdn
    const leapDaysSkipped = countLeapDaysInRange(targetJdn, EPOCH_JDN, year, EPOCH_YEAR)
    const adjustedDays = days - leapDaysSkipped
    // Going backward: subtract from epoch kin
    const kin = ((EPOCH_KIN - 1 - (adjustedDays % 260) + 260) % 260) + 1
    return asKin(kin)
  }
}

export function kinToSeal(kin: Kin): SealNumber {
  return asSeal(((kin - 1) % 20) + 1)
}

export function kinToTone(kin: Kin): ToneNumber {
  return asTone(((kin - 1) % 13) + 1)
}
