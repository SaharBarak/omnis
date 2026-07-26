import { describe, it, expect } from 'vitest'
import { asKin, asTone } from '../types/branded'
import {
  kinToWavespellNumber,
  kinToWavespell,
  getWavespell,
  getWavespellStartKin,
  getWavespellEndKin,
  getWavespellSeal,
  getWavespellPosition,
  getWavespellKins,
  getWavespellRole,
  getAllWavespells,
  getCurrentWavespellInfo,
} from './wavespell'

describe('Wavespell calculations', () => {
  describe('kinToWavespellNumber', () => {
    it('should return 1 for kin 1-13', () => {
      expect(kinToWavespellNumber(asKin(1))).toBe(1)
      expect(kinToWavespellNumber(asKin(7))).toBe(1)
      expect(kinToWavespellNumber(asKin(13))).toBe(1)
    })

    it('should return 2 for kin 14-26', () => {
      expect(kinToWavespellNumber(asKin(14))).toBe(2)
      expect(kinToWavespellNumber(asKin(20))).toBe(2)
      expect(kinToWavespellNumber(asKin(26))).toBe(2)
    })

    it('should return 20 for kin 248-260', () => {
      expect(kinToWavespellNumber(asKin(248))).toBe(20)
      expect(kinToWavespellNumber(asKin(255))).toBe(20)
      expect(kinToWavespellNumber(asKin(260))).toBe(20)
    })
  })

  describe('getWavespellStartKin', () => {
    it('should return kin 1 for wavespell 1', () => {
      expect(getWavespellStartKin(1)).toBe(1)
    })

    it('should return kin 14 for wavespell 2', () => {
      expect(getWavespellStartKin(2)).toBe(14)
    })

    it('should return kin 248 for wavespell 20', () => {
      expect(getWavespellStartKin(20)).toBe(248)
    })

    it('should throw for invalid wavespell number', () => {
      expect(() => getWavespellStartKin(0)).toThrow(RangeError)
      expect(() => getWavespellStartKin(21)).toThrow(RangeError)
    })
  })

  describe('getWavespellEndKin', () => {
    it('should return kin 13 for wavespell 1', () => {
      expect(getWavespellEndKin(1)).toBe(13)
    })

    it('should return kin 260 for wavespell 20', () => {
      expect(getWavespellEndKin(20)).toBe(260)
    })
  })

  describe('getWavespellSeal', () => {
    it('should return seal 1 (Dragon) for wavespell 1', () => {
      expect(getWavespellSeal(1)).toBe(1)
    })

    it('should return seal 14 (Wizard) for wavespell 2', () => {
      // Wavespell 2 starts at Kin 14, seal = ((14-1) % 20) + 1 = 14
      expect(getWavespellSeal(2)).toBe(14)
    })

    it('should return seal 8 (Star) for wavespell 20', () => {
      // Wavespell 20 starts at Kin 248, seal = ((248-1) % 20) + 1 = 8
      expect(getWavespellSeal(20)).toBe(8)
    })
  })

  describe('getWavespell', () => {
    it('should return complete wavespell data', () => {
      const ws = getWavespell(1)
      expect(ws.number).toBe(1)
      expect(ws.sealNumber).toBe(1)
      expect(ws.startKin).toBe(1)
      expect(ws.endKin).toBe(13)
    })
  })

  describe('kinToWavespell', () => {
    it('should return wavespell 1 for kin 7', () => {
      const ws = kinToWavespell(asKin(7))
      expect(ws.number).toBe(1)
      expect(ws.sealNumber).toBe(1)
    })
  })

  describe('getWavespellPosition', () => {
    it('should return position 1 for first day of wavespell', () => {
      const pos = getWavespellPosition(asKin(1))
      expect(pos.position).toBe(1)
      expect(pos.dayName).toBe('Purpose')
    })

    it('should return position 7 for center of wavespell', () => {
      const pos = getWavespellPosition(asKin(7))
      expect(pos.position).toBe(7)
      expect(pos.dayName).toBe('Attunement')
    })

    it('should return position 13 for last day of wavespell', () => {
      const pos = getWavespellPosition(asKin(13))
      expect(pos.position).toBe(13)
      expect(pos.dayName).toBe('Presence')
    })
  })

  describe('getWavespellKins', () => {
    it('should return 13 kins for wavespell 1', () => {
      const kins = getWavespellKins(1)
      expect(kins.length).toBe(13)
      expect(kins[0]).toBe(1)
      expect(kins[12]).toBe(13)
    })

    it('should return correct kins for wavespell 2', () => {
      const kins = getWavespellKins(2)
      expect(kins[0]).toBe(14)
      expect(kins[12]).toBe(26)
    })
  })

  describe('getWavespellRole', () => {
    it('should return correct roles for each position', () => {
      expect(getWavespellRole(asTone(1))).toBe('Purpose')
      expect(getWavespellRole(asTone(2))).toBe('Challenge')
      expect(getWavespellRole(asTone(7))).toBe('Attunement')
      expect(getWavespellRole(asTone(13))).toBe('Presence')
    })
  })

  describe('getAllWavespells', () => {
    it('should return 20 wavespells', () => {
      const all = getAllWavespells()
      expect(all.length).toBe(20)
      expect(all[0].number).toBe(1)
      expect(all[19].number).toBe(20)
    })
  })

  describe('getCurrentWavespellInfo', () => {
    it('should identify start of wavespell', () => {
      const info = getCurrentWavespellInfo(asKin(1))
      expect(info.isAtStart).toBe(true)
      expect(info.isAtCenter).toBe(false)
      expect(info.isAtEnd).toBe(false)
      expect(info.kinsRemaining).toBe(12)
    })

    it('should identify center of wavespell', () => {
      const info = getCurrentWavespellInfo(asKin(7))
      expect(info.isAtStart).toBe(false)
      expect(info.isAtCenter).toBe(true)
      expect(info.isAtEnd).toBe(false)
      expect(info.kinsRemaining).toBe(6)
    })

    it('should identify end of wavespell', () => {
      const info = getCurrentWavespellInfo(asKin(13))
      expect(info.isAtStart).toBe(false)
      expect(info.isAtCenter).toBe(false)
      expect(info.isAtEnd).toBe(true)
      expect(info.kinsRemaining).toBe(0)
    })
  })
})
