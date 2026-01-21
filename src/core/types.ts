// Branded types for type-safe numeric values

type Brand<T, B> = T & { __brand: B }

export type Kin = Brand<number, 'Kin'>           // 1-260
export type SealNumber = Brand<number, 'Seal'>   // 1-20
export type ToneNumber = Brand<number, 'Tone'>   // 1-13
export type JulianDay = Brand<number, 'JulianDay'>

export function asKin(n: number): Kin {
  const normalized = ((n - 1) % 260 + 260) % 260 + 1
  return normalized as Kin
}

export function asSeal(n: number): SealNumber {
  if (n < 1 || n > 20) throw new RangeError(`Invalid Seal: ${n}`)
  return n as SealNumber
}

export function asTone(n: number): ToneNumber {
  if (n < 1 || n > 13) throw new RangeError(`Invalid Tone: ${n}`)
  return n as ToneNumber
}

export function asJulianDay(n: number): JulianDay {
  return n as JulianDay
}
