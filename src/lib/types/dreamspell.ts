import type { Kin, SealNumber } from '../../core/types.ts'
import type { Seal } from './seal.ts'
import type { Tone } from './tone.ts'

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
}
