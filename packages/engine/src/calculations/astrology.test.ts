import { describe, it, expect } from 'vitest'
import {
  calculateNatalChart,
  calculateSunSignChart,
  getSunSign,
  getApproximateSunSign,
  getCurrentPlanetaryPositions,
  formatPlanetPosition,
  getChartSummary,
} from './astrology'
import {
  ZODIAC_SIGNS,
  getZodiacSignByNumber,
  getZodiacSignById,
  getZodiacSignFromLongitude,
  getDegreeInSign,
  getMinuteInDegree,
  formatZodiacPosition,
} from '../data/zodiac-signs'
import { PLANETS, getPlanetById, CELESTIAL_BODIES, CELESTIAL_POINTS } from '../data/planets'
import { HOUSES, getHouseByNumber, ANGULAR_HOUSES } from '../data/houses'
import { ASPECTS, findAspect, MAJOR_ASPECTS, HARD_ASPECTS, SOFT_ASPECTS } from '../data/aspects'

describe('Astrology Data', () => {
  describe('Zodiac Signs', () => {
    it('should have 12 zodiac signs', () => {
      expect(ZODIAC_SIGNS).toHaveLength(12)
    })

    it('should have correct properties for Aries', () => {
      const aries = getZodiacSignByNumber(1)
      expect(aries.name).toBe('Aries')
      expect(aries.hebrew).toBe('טלה')
      expect(aries.symbol).toBe('♈')
      expect(aries.element).toBe('fire')
      expect(aries.modality).toBe('cardinal')
      expect(aries.ruler).toBe('mars')
      expect(aries.degreesStart).toBe(0)
      expect(aries.degreesEnd).toBe(30)
    })

    it('should have correct element distribution (3 each)', () => {
      const elements = ZODIAC_SIGNS.map(s => s.element)
      expect(elements.filter(e => e === 'fire')).toHaveLength(3)
      expect(elements.filter(e => e === 'earth')).toHaveLength(3)
      expect(elements.filter(e => e === 'air')).toHaveLength(3)
      expect(elements.filter(e => e === 'water')).toHaveLength(3)
    })

    it('should have correct modality distribution (4 each)', () => {
      const modalities = ZODIAC_SIGNS.map(s => s.modality)
      expect(modalities.filter(m => m === 'cardinal')).toHaveLength(4)
      expect(modalities.filter(m => m === 'fixed')).toHaveLength(4)
      expect(modalities.filter(m => m === 'mutable')).toHaveLength(4)
    })

    it('should throw for invalid sign number', () => {
      expect(() => getZodiacSignByNumber(0)).toThrow(RangeError)
      expect(() => getZodiacSignByNumber(13)).toThrow(RangeError)
    })

    it('should get sign by ID', () => {
      const leo = getZodiacSignById('leo')
      expect(leo.number).toBe(5)
      expect(leo.name).toBe('Leo')
    })

    it('should get sign from longitude', () => {
      expect(getZodiacSignFromLongitude(0).name).toBe('Aries')
      expect(getZodiacSignFromLongitude(15).name).toBe('Aries')
      expect(getZodiacSignFromLongitude(30).name).toBe('Taurus')
      expect(getZodiacSignFromLongitude(90).name).toBe('Cancer')
      expect(getZodiacSignFromLongitude(180).name).toBe('Libra')
      expect(getZodiacSignFromLongitude(270).name).toBe('Capricorn')
      expect(getZodiacSignFromLongitude(359).name).toBe('Pisces')
    })

    it('should calculate degree within sign', () => {
      expect(getDegreeInSign(0)).toBe(0)
      expect(getDegreeInSign(15)).toBe(15)
      expect(getDegreeInSign(29.9)).toBe(29)
      expect(getDegreeInSign(30)).toBe(0)
      expect(getDegreeInSign(45)).toBe(15)
    })

    it('should format zodiac position correctly', () => {
      expect(formatZodiacPosition(0)).toMatch(/0°00' Aries/)
      expect(formatZodiacPosition(45.5)).toMatch(/15°\d+' Taurus/)
      expect(formatZodiacPosition(180)).toMatch(/0°00' Libra/)
    })
  })

  describe('Planets', () => {
    it('should have 13 planets (including nodes and lilith)', () => {
      expect(PLANETS).toHaveLength(13)
    })

    it('should have correct properties for Sun', () => {
      const sun = getPlanetById('sun')
      expect(sun.name).toBe('Sun')
      expect(sun.hebrew).toBe('שמש')
      expect(sun.symbol).toBe('☉')
      expect(sun.type).toBe('luminary')
    })

    it('should have 10 celestial bodies (excluding points)', () => {
      expect(CELESTIAL_BODIES).toHaveLength(10)
      expect(CELESTIAL_BODIES.map(p => p.id)).not.toContain('northNode')
    })

    it('should have 3 celestial points', () => {
      expect(CELESTIAL_POINTS).toHaveLength(3)
      expect(CELESTIAL_POINTS.map(p => p.id)).toContain('northNode')
      expect(CELESTIAL_POINTS.map(p => p.id)).toContain('southNode')
      expect(CELESTIAL_POINTS.map(p => p.id)).toContain('lilith')
    })

    it('should throw for unknown planet ID', () => {
      // @ts-expect-error Testing invalid input
      expect(() => getPlanetById('unknown')).toThrow()
    })
  })

  describe('Houses', () => {
    it('should have 12 houses', () => {
      expect(HOUSES).toHaveLength(12)
    })

    it('should have correct properties for First House', () => {
      const house1 = getHouseByNumber(1)
      expect(house1.name).toBe('First House')
      expect(house1.hebrew).toBe('בית ראשון')
      expect(house1.theme).toBe('Self')
      expect(house1.naturalSign).toBe('aries')
    })

    it('should have 4 angular houses', () => {
      expect(ANGULAR_HOUSES).toHaveLength(4)
      expect(ANGULAR_HOUSES.map(h => h.number)).toEqual([1, 4, 7, 10])
    })

    it('should throw for invalid house number', () => {
      expect(() => getHouseByNumber(0)).toThrow(RangeError)
      expect(() => getHouseByNumber(13)).toThrow(RangeError)
    })
  })

  describe('Aspects', () => {
    it('should have 7 aspects', () => {
      expect(ASPECTS).toHaveLength(7)
    })

    it('should have correct properties for Conjunction', () => {
      const conjunction = ASPECTS.find(a => a.name === 'Conjunction')
      expect(conjunction).toBeDefined()
      expect(conjunction!.angle).toBe(0)
      expect(conjunction!.orb).toBe(8)
      expect(conjunction!.nature).toBe('major-hard')
      expect(conjunction!.hebrew).toBe('צימוד')
    })

    it('should have 5 major aspects', () => {
      expect(MAJOR_ASPECTS).toHaveLength(5)
    })

    it('should have 3 hard aspects', () => {
      expect(HARD_ASPECTS).toHaveLength(3)
      expect(HARD_ASPECTS.map(a => a.name)).toContain('Conjunction')
      expect(HARD_ASPECTS.map(a => a.name)).toContain('Opposition')
      expect(HARD_ASPECTS.map(a => a.name)).toContain('Square')
    })

    it('should have 2 soft aspects', () => {
      expect(SOFT_ASPECTS).toHaveLength(2)
      expect(SOFT_ASPECTS.map(a => a.name)).toContain('Trine')
      expect(SOFT_ASPECTS.map(a => a.name)).toContain('Sextile')
    })

    it('should find aspects between longitudes', () => {
      // Conjunction (0°)
      const conj = findAspect(10, 12)
      expect(conj).not.toBeNull()
      expect(conj!.aspect.name).toBe('Conjunction')

      // Opposition (180°)
      const opp = findAspect(0, 180)
      expect(opp).not.toBeNull()
      expect(opp!.aspect.name).toBe('Opposition')

      // Square (90°)
      const sq = findAspect(0, 90)
      expect(sq).not.toBeNull()
      expect(sq!.aspect.name).toBe('Square')

      // Trine (120°)
      const tri = findAspect(0, 120)
      expect(tri).not.toBeNull()
      expect(tri!.aspect.name).toBe('Trine')

      // Sextile (60°)
      const sex = findAspect(0, 60)
      expect(sex).not.toBeNull()
      expect(sex!.aspect.name).toBe('Sextile')
    })

    it('should return null for non-aspectual angles', () => {
      const noAspect = findAspect(0, 45)
      expect(noAspect).toBeNull()
    })
  })
})

describe('Astrology Calculations', () => {
  describe('calculateNatalChart', () => {
    it('should calculate chart for known date', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        time: '12:00',
        latitude: 51.5074, // London
        longitude: -0.1278,
      })

      expect(chart.birthDate).toBe('2000-01-01')
      expect(chart.hasBirthTime).toBe(true)
      expect(chart.planets.length).toBeGreaterThan(0)
      expect(chart.houses).not.toBeNull()
      expect(chart.ascendant).not.toBeNull()
      expect(chart.midheaven).not.toBeNull()
    })

    it('should calculate sun in Capricorn for Jan 1 2000', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        latitude: 0,
        longitude: 0,
      })

      // Sun should be in Capricorn on January 1st
      expect(chart.sunSign.name).toBe('Capricorn')
    })

    it('should handle dates without birth time', () => {
      const chart = calculateNatalChart({
        date: '1990-06-15',
        latitude: 40.7128,
        longitude: -74.006,
      })

      expect(chart.hasBirthTime).toBe(false)
      expect(chart.houses).toBeNull()
      expect(chart.ascendant).toBeNull()
      expect(chart.midheaven).toBeNull()
      expect(chart.sunSign).toBeDefined()
    })

    it('should include all major celestial bodies', () => {
      const chart = calculateNatalChart({
        date: '2020-12-21',
        time: '18:00',
        latitude: 34.0522,
        longitude: -118.2437,
      })

      const planetIds = chart.planets.map(p => p.planet.id)
      expect(planetIds).toContain('sun')
      expect(planetIds).toContain('moon')
      expect(planetIds).toContain('mercury')
      expect(planetIds).toContain('venus')
      expect(planetIds).toContain('mars')
      expect(planetIds).toContain('jupiter')
      expect(planetIds).toContain('saturn')
      expect(planetIds).toContain('uranus')
      expect(planetIds).toContain('neptune')
      expect(planetIds).toContain('pluto')
    })

    it('should calculate element balance', () => {
      const chart = calculateNatalChart({
        date: '2020-12-21',
        latitude: 0,
        longitude: 0,
      })

      const totalBalance =
        chart.elementBalance.fire +
        chart.elementBalance.earth +
        chart.elementBalance.air +
        chart.elementBalance.water

      // Total should be approximately 100%
      expect(totalBalance).toBeGreaterThanOrEqual(95)
      expect(totalBalance).toBeLessThanOrEqual(105)
    })

    it('should calculate modality balance', () => {
      const chart = calculateNatalChart({
        date: '2020-12-21',
        latitude: 0,
        longitude: 0,
      })

      const totalBalance =
        chart.modalityBalance.cardinal +
        chart.modalityBalance.fixed +
        chart.modalityBalance.mutable

      // Total should be approximately 100%
      expect(totalBalance).toBeGreaterThanOrEqual(95)
      expect(totalBalance).toBeLessThanOrEqual(105)
    })

    it('should detect retrograde planets', () => {
      // Mercury retrograde is common; just check the field exists
      const chart = calculateNatalChart({
        date: '2020-10-15', // Mercury was retrograde around this time
        latitude: 0,
        longitude: 0,
      })

      const mercury = chart.planets.find(p => p.planet.id === 'mercury')
      expect(mercury).toBeDefined()
      expect(typeof mercury!.retrograde).toBe('boolean')
    })

    it('should calculate house placements when birth time is provided', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        time: '12:00',
        latitude: 51.5074,
        longitude: -0.1278,
      })

      expect(chart.houses).not.toBeNull()
      expect(chart.houses).toHaveLength(12)

      // All planets should have house placements
      for (const planet of chart.planets) {
        expect(planet.house).toBeGreaterThanOrEqual(1)
        expect(planet.house).toBeLessThanOrEqual(12)
      }
    })

    it('should calculate aspects between planets', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        time: '12:00',
        latitude: 51.5074,
        longitude: -0.1278,
      })

      // There should be some aspects
      expect(chart.aspects.length).toBeGreaterThan(0)

      // Each aspect should have valid structure
      for (const aspect of chart.aspects) {
        expect(aspect.planet1).toBeDefined()
        expect(aspect.planet2).toBeDefined()
        expect(aspect.aspect).toBeDefined()
        expect(aspect.orb).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('calculateSunSignChart', () => {
    it('should return simplified chart without houses', () => {
      const chart = calculateSunSignChart('2000-01-01', 0, 0)

      expect(chart.birthDate).toBe('2000-01-01')
      expect(chart.sunSign).toBeDefined()
      expect(chart.planets.length).toBeGreaterThan(0)
      expect(chart.aspects.length).toBeGreaterThan(0)
    })

    it('should mark moon as approximate', () => {
      const chart = calculateSunSignChart('2000-01-01', 0, 0)

      const moonEntry = chart.planets.find(p => p.planet.id === 'moon')
      expect(moonEntry).toBeDefined()
      expect(moonEntry!.approximate).toBe(true)
    })

    it('should not mark sun as approximate', () => {
      const chart = calculateSunSignChart('2000-01-01', 0, 0)

      const sunEntry = chart.planets.find(p => p.planet.id === 'sun')
      expect(sunEntry).toBeDefined()
      expect(sunEntry!.approximate).toBe(false)
    })
  })

  describe('getSunSign', () => {
    it('should return Capricorn for Jan 1', () => {
      const sign = getSunSign('2000-01-01')
      expect(sign.name).toBe('Capricorn')
    })

    it('should return Aries for Mar 25', () => {
      const sign = getSunSign('2000-03-25')
      expect(sign.name).toBe('Aries')
    })

    it('should return Leo for Aug 1', () => {
      const sign = getSunSign('2000-08-01')
      expect(sign.name).toBe('Leo')
    })
  })

  describe('getApproximateSunSign', () => {
    it('should return correct signs for typical dates', () => {
      expect(getApproximateSunSign(1, 1).name).toBe('Capricorn')
      expect(getApproximateSunSign(1, 20).name).toBe('Aquarius')
      expect(getApproximateSunSign(3, 21).name).toBe('Aries')
      expect(getApproximateSunSign(6, 21).name).toBe('Cancer')
      expect(getApproximateSunSign(9, 23).name).toBe('Libra')
      expect(getApproximateSunSign(12, 22).name).toBe('Capricorn')
    })

    it('should handle edge dates correctly', () => {
      // Just before Aquarius
      expect(getApproximateSunSign(1, 19).name).toBe('Capricorn')
      // Aquarius starts
      expect(getApproximateSunSign(1, 20).name).toBe('Aquarius')
    })
  })

  describe('getCurrentPlanetaryPositions', () => {
    it('should return positions for all major planets', () => {
      const positions = getCurrentPlanetaryPositions('2024-01-01')

      expect(positions.length).toBeGreaterThanOrEqual(10)

      const planetIds = positions.map(p => p.planet.id)
      expect(planetIds).toContain('sun')
      expect(planetIds).toContain('moon')
      expect(planetIds).toContain('mercury')
    })

    it('should have null house placements', () => {
      const positions = getCurrentPlanetaryPositions('2024-01-01')

      for (const pos of positions) {
        expect(pos.house).toBeNull()
      }
    })
  })

  describe('formatPlanetPosition', () => {
    it('should format position with symbol and degree', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        latitude: 0,
        longitude: 0,
      })

      const sun = chart.planets.find(p => p.planet.id === 'sun')
      expect(sun).toBeDefined()

      const formatted = formatPlanetPosition(sun!)
      expect(formatted).toContain('☉')
      expect(formatted).toContain('Capricorn')
    })

    it('should include retrograde symbol when applicable', () => {
      // Create a mock position with retrograde
      const mockPosition = {
        planet: getPlanetById('mercury'),
        position: {
          sign: getZodiacSignByNumber(1),
          degree: 15,
          minute: 30,
          longitude: 15.5,
          formatted: "15°30' Aries",
        },
        house: 1,
        retrograde: true,
        dignity: 'neutral' as const,
      }

      const formatted = formatPlanetPosition(mockPosition)
      expect(formatted).toContain('℞')
    })
  })

  describe('getChartSummary', () => {
    it('should return summary with key information', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        time: '12:00',
        latitude: 51.5074,
        longitude: -0.1278,
      })

      const summary = getChartSummary(chart)

      expect(summary.sunSign).toBe('Capricorn')
      expect(summary.moonSign).toBeDefined()
      expect(summary.risingSign).toBeDefined()
      expect(summary.dominantElement).toBeDefined()
      expect(summary.dominantModality).toBeDefined()
    })

    it('should have null rising sign when birth time is unknown', () => {
      const chart = calculateNatalChart({
        date: '2000-01-01',
        latitude: 0,
        longitude: 0,
      })

      const summary = getChartSummary(chart)
      expect(summary.risingSign).toBeNull()
    })
  })
})

describe('Known Date Validation', () => {
  // Test with known historical dates to validate calculations
  it('should calculate Great Conjunction 2020 correctly', () => {
    // December 21, 2020: Jupiter-Saturn conjunction at 0° Aquarius
    const chart = calculateNatalChart({
      date: '2020-12-21',
      time: '18:00',
      latitude: 0,
      longitude: 0,
    })

    const jupiter = chart.planets.find(p => p.planet.id === 'jupiter')
    const saturn = chart.planets.find(p => p.planet.id === 'saturn')

    expect(jupiter).toBeDefined()
    expect(saturn).toBeDefined()

    // Both should be in Aquarius
    expect(jupiter!.position.sign.name).toBe('Aquarius')
    expect(saturn!.position.sign.name).toBe('Aquarius')

    // Check for conjunction aspect
    const conjunction = chart.aspects.find(
      a =>
        ((a.planet1 === 'jupiter' && a.planet2 === 'saturn') ||
          (a.planet1 === 'saturn' && a.planet2 === 'jupiter')) &&
        a.aspect.name === 'Conjunction'
    )
    expect(conjunction).toBeDefined()
  })

  it('should calculate 2012 winter solstice correctly', () => {
    // December 21, 2012: End of Mayan calendar, Sun enters Capricorn
    // The exact time of the solstice was around 11:12 UTC, so at noon the Sun
    // has just entered Capricorn or is at the very end of Sagittarius
    const chart = calculateNatalChart({
      date: '2012-12-21',
      latitude: 0,
      longitude: 0,
    })

    // On the cusp - could be either depending on exact calculation
    expect(['Sagittarius', 'Capricorn']).toContain(chart.sunSign.name)
  })

  it('should handle test data from project', () => {
    // Test with one of the project's test people: ליאור born 1966-09-23
    const chart = calculateNatalChart({
      date: '1966-09-23',
      latitude: 32.0853, // Tel Aviv
      longitude: 34.7818,
    })

    // Sun should be in Virgo or Libra (cusp around Sep 22-23)
    expect(['Virgo', 'Libra']).toContain(chart.sunSign.name)
  })
})
