import { describe, it, expect } from 'vitest'
import { asKin, asSeal } from '../types/core'
import {
  getCastle,
  kinToCastleNumber,
  kinToCastle,
  getCastleKins,
  getCastleWavespellDetails,
  getAllCastles,
  getEarthFamily,
  getAllEarthFamilies,
  getColorFamily,
  getAllColorFamilies,
  getHarmonic,
  kinToHarmonicNumber,
  kinToHarmonic,
  getKinCycleInfo,
  getTzolkinCycleDay,
} from './cycles'

describe('Castle calculations', () => {
  describe('kinToCastleNumber', () => {
    it('should return 1 for kin 1-52', () => {
      expect(kinToCastleNumber(asKin(1))).toBe(1)
      expect(kinToCastleNumber(asKin(26))).toBe(1)
      expect(kinToCastleNumber(asKin(52))).toBe(1)
    })

    it('should return 2 for kin 53-104', () => {
      expect(kinToCastleNumber(asKin(53))).toBe(2)
      expect(kinToCastleNumber(asKin(78))).toBe(2)
      expect(kinToCastleNumber(asKin(104))).toBe(2)
    })

    it('should return 5 for kin 209-260', () => {
      expect(kinToCastleNumber(asKin(209))).toBe(5)
      expect(kinToCastleNumber(asKin(234))).toBe(5)
      expect(kinToCastleNumber(asKin(260))).toBe(5)
    })
  })

  describe('getCastle', () => {
    it('should return Red Castle for castle 1', () => {
      const castle = getCastle(1)
      expect(castle.number).toBe(1)
      expect(castle.color).toBe('red')
      expect(castle.name).toBe('Castle of Turning')
      expect(castle.startKin).toBe(1)
      expect(castle.endKin).toBe(52)
      expect(castle.wavespells).toEqual([1, 2, 3, 4])
    })

    it('should return Green Castle for castle 5', () => {
      const castle = getCastle(5)
      expect(castle.number).toBe(5)
      expect(castle.color).toBe('green')
      expect(castle.name).toBe('Castle of Enchantment')
      expect(castle.startKin).toBe(209)
      expect(castle.endKin).toBe(260)
      expect(castle.wavespells).toEqual([17, 18, 19, 20])
    })

    it('should throw for invalid castle number', () => {
      expect(() => getCastle(0)).toThrow(RangeError)
      expect(() => getCastle(6)).toThrow(RangeError)
    })
  })

  describe('kinToCastle', () => {
    it('should return correct castle for kin', () => {
      const castle = kinToCastle(asKin(100))
      expect(castle.number).toBe(2)
      expect(castle.color).toBe('white')
    })
  })

  describe('getCastleKins', () => {
    it('should return 52 kins for castle 1', () => {
      const kins = getCastleKins(1)
      expect(kins.length).toBe(52)
      expect(kins[0]).toBe(1)
      expect(kins[51]).toBe(52)
    })

    it('should return correct kins for castle 5', () => {
      const kins = getCastleKins(5)
      expect(kins[0]).toBe(209)
      expect(kins[51]).toBe(260)
    })
  })

  describe('getCastleWavespellDetails', () => {
    it('should return 4 wavespells for each castle', () => {
      const wavespells = getCastleWavespellDetails(1)
      expect(wavespells.length).toBe(4)
      expect(wavespells[0].number).toBe(1)
      expect(wavespells[3].number).toBe(4)
    })
  })

  describe('getAllCastles', () => {
    it('should return all 5 castles', () => {
      const castles = getAllCastles()
      expect(castles.length).toBe(5)
      expect(castles[0].color).toBe('red')
      expect(castles[4].color).toBe('green')
    })
  })
})

describe('Earth Family calculations', () => {
  describe('getEarthFamily', () => {
    it('should return Polar family for seal 1 (Dragon)', () => {
      const family = getEarthFamily(asSeal(1))
      expect(family.name).toBe('Polar')
      expect(family.seals).toContain(1)
    })

    it('should return Cardinal family for seal 2 (Wind)', () => {
      const family = getEarthFamily(asSeal(2))
      expect(family.name).toBe('Cardinal')
    })

    it('should return Gateway family for seal 5 (Serpent)', () => {
      const family = getEarthFamily(asSeal(5))
      expect(family.name).toBe('Gateway')
    })

    it('should cycle through families correctly', () => {
      // Seals 1, 6, 11, 16 are all Polar
      expect(getEarthFamily(asSeal(1)).name).toBe('Polar')
      expect(getEarthFamily(asSeal(6)).name).toBe('Polar')
      expect(getEarthFamily(asSeal(11)).name).toBe('Polar')
      expect(getEarthFamily(asSeal(16)).name).toBe('Polar')
    })
  })

  describe('getAllEarthFamilies', () => {
    it('should return 5 families', () => {
      const families = getAllEarthFamilies()
      expect(families.length).toBe(5)
      expect(families[0].name).toBe('Polar')
      expect(families[4].name).toBe('Gateway')
    })
  })
})

describe('Color Family calculations', () => {
  describe('getColorFamily', () => {
    it('should return red for seal 1 (Dragon)', () => {
      const family = getColorFamily(asSeal(1))
      expect(family.color).toBe('red')
    })

    it('should return white for seal 2 (Wind)', () => {
      const family = getColorFamily(asSeal(2))
      expect(family.color).toBe('white')
    })

    it('should return blue for seal 3 (Night)', () => {
      const family = getColorFamily(asSeal(3))
      expect(family.color).toBe('blue')
    })

    it('should return yellow for seal 4 (Seed)', () => {
      const family = getColorFamily(asSeal(4))
      expect(family.color).toBe('yellow')
    })

    it('should cycle colors every 4 seals', () => {
      expect(getColorFamily(asSeal(5)).color).toBe('red')
      expect(getColorFamily(asSeal(9)).color).toBe('red')
      expect(getColorFamily(asSeal(13)).color).toBe('red')
    })
  })

  describe('getAllColorFamilies', () => {
    it('should return 4 color families', () => {
      const families = getAllColorFamilies()
      expect(families.length).toBe(4)
      expect(families.map(f => f.color)).toEqual(['red', 'white', 'blue', 'yellow'])
    })
  })
})

describe('Harmonic calculations', () => {
  describe('kinToHarmonicNumber', () => {
    it('should return 1 for kin 1-4', () => {
      expect(kinToHarmonicNumber(asKin(1))).toBe(1)
      expect(kinToHarmonicNumber(asKin(4))).toBe(1)
    })

    it('should return 65 for kin 257-260', () => {
      expect(kinToHarmonicNumber(asKin(257))).toBe(65)
      expect(kinToHarmonicNumber(asKin(260))).toBe(65)
    })
  })

  describe('getHarmonic', () => {
    it('should return correct harmonic data', () => {
      const harmonic = getHarmonic(1)
      expect(harmonic.number).toBe(1)
      expect(harmonic.startKin).toBe(1)
      expect(harmonic.endKin).toBe(4)
      expect(harmonic.colorSequence).toEqual(['red', 'white', 'blue', 'yellow'])
    })

    it('should throw for invalid harmonic number', () => {
      expect(() => getHarmonic(0)).toThrow(RangeError)
      expect(() => getHarmonic(66)).toThrow(RangeError)
    })
  })

  describe('kinToHarmonic', () => {
    it('should return correct harmonic for kin', () => {
      const harmonic = kinToHarmonic(asKin(5))
      expect(harmonic.number).toBe(2)
      expect(harmonic.startKin).toBe(5)
    })
  })
})

describe('Comprehensive cycle info', () => {
  describe('getKinCycleInfo', () => {
    it('should return complete cycle info for kin 1', () => {
      const info = getKinCycleInfo(asKin(1))
      expect(info.kin).toBe(1)
      expect(info.castle.number).toBe(1)
      expect(info.castlePosition).toBe(1)
      expect(info.wavespellNumber).toBe(1)
      expect(info.wavespellPosition).toBe(1)
      expect(info.harmonic.number).toBe(1)
      expect(info.harmonicPosition).toBe(1)
      expect(info.earthFamily.name).toBe('Polar')
      expect(info.colorFamily.color).toBe('red')
    })

    it('should return correct info for kin 100', () => {
      const info = getKinCycleInfo(asKin(100))
      expect(info.castle.number).toBe(2) // Kin 53-104 = Castle 2
      expect(info.castlePosition).toBe(48) // 100 - 52 = 48
      expect(info.wavespellNumber).toBe(8) // ceil(100/13) = 8
      expect(info.wavespellPosition).toBe(9) // ((100-1) % 13) + 1 = 9
      expect(info.harmonic.number).toBe(25) // ceil(100/4) = 25
      expect(info.harmonicPosition).toBe(4) // ((100-1) % 4) + 1 = 4
    })
  })

  describe('getTzolkinCycleDay', () => {
    it('should return kin number for epoch date', () => {
      expect(getTzolkinCycleDay('1987-07-26')).toBe(34)
    })
  })
})
