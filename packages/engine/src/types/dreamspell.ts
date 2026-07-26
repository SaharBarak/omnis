import type { Kin, SealNumber, ToneNumber } from '../types/core'
import type { Seal } from './seal'
import type { Tone } from './tone'

export interface DreamspellKin {
  kin: Kin
  seal: Seal
  tone: Tone
}

export interface Oracle {
  guide: SealNumber
  analog: SealNumber
  antipode: SealNumber
  occult: SealNumber
  occultTone: ToneNumber
}
