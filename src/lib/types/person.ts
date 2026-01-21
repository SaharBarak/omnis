import type { DreamspellKin, Oracle } from './dreamspell'
import type { TzolkinDay } from './tzolkin'

export interface Person {
  name: string          // Hebrew name
  birthDate: string     // YYYY-MM-DD
}

export interface ComputedPerson extends Person {
  dreamspell: DreamspellKin & { oracle: Oracle }
  tzolkin: TzolkinDay
}
