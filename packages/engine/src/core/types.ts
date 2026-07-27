export type Kin = number & { readonly __brand: 'Kin' }
export type SealNumber = number & { readonly __brand: 'SealNumber' }
export type ToneNumber = number & { readonly __brand: 'ToneNumber' }
export type JulianDay = number & { readonly __brand: 'JulianDay' }

export function asKin(value: number): Kin {
  if (!Number.isInteger(value) || value < 1 || value > 260) throw new RangeError(`Kin must be an integer from 1 to 260: ${value}`)
  return value as Kin
}

export function asSeal(value: number): SealNumber {
  if (!Number.isInteger(value) || value < 1 || value > 20) throw new RangeError(`Seal must be an integer from 1 to 20: ${value}`)
  return value as SealNumber
}

export function asTone(value: number): ToneNumber {
  if (!Number.isInteger(value) || value < 1 || value > 13) throw new RangeError(`Tone must be an integer from 1 to 13: ${value}`)
  return value as ToneNumber
}

export function asJulianDay(value: number): JulianDay {
  if (!Number.isInteger(value)) throw new RangeError(`Julian day must be an integer: ${value}`)
  return value as JulianDay
}
