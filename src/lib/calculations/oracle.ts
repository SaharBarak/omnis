import type { Kin, SealNumber, ToneNumber } from '../../core/types'
import type { Oracle } from '../types/dreamspell'
import { getAnalog, getAntipode, getOccult, getGuide } from '../data/oracle-tables'
import { kinToSeal, kinToTone } from './dreamspell'

export function calculateOracle(kin: Kin): Oracle {
  const seal: SealNumber = kinToSeal(kin)
  const tone: ToneNumber = kinToTone(kin)

  return {
    guide: getGuide(seal, tone),
    analog: getAnalog(seal),
    antipode: getAntipode(seal),
    occult: getOccult(seal),
  }
}
