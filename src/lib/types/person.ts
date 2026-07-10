import type { DreamspellKin, Oracle } from '@pleiad/engine/types/dreamspell'
import type { TzolkinDay } from '@pleiad/engine/types/tzolkin'

export interface Person {
  name: string          // Hebrew name
  birthDate: string     // YYYY-MM-DD
}

export interface ComputedPerson extends Person {
  dreamspell: DreamspellKin & { oracle: Oracle }
  tzolkin: TzolkinDay
}
