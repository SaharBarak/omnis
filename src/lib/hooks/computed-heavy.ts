import { calculateNatalChart, calculateSunSignChart } from '@pleiad/engine/calculations/astrology'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import type { AstrologyComputedData, HumanDesignComputedData } from './use-computed-results'

/**
 * The astrology and Human Design halves of a person's computed results.
 * Both engines sit on ephemeris packages, so the hook loads this module on
 * demand instead of bundling it with every page that lists people.
 */

type Place = { readonly lat: number; readonly lng: number } | null | undefined

/** Where the chart is cast when no birth place is stored: Tel Aviv. */
const DEFAULT_PLACE = Object.freeze({ lat: 32.0853, lng: 34.7818 })

const placeOrDefault = (place: Place) => ({ lat: place?.lat ?? DEFAULT_PLACE.lat, lng: place?.lng ?? DEFAULT_PLACE.lng })

const dominant = (balance: Readonly<Record<string, number>>): string =>
  Object.entries(balance).reduce((best, [key, value]) => (value > best.value ? { key, value } : best), { key: 'unknown', value: 0 }).key

const UNKNOWN_HEBREW = 'לא ידוע'

const NO_BIRTH_TIME_DESIGN: HumanDesignComputedData = Object.freeze({
  hasBirthTime: false,
  type: 'Unknown',
  typeHebrew: UNKNOWN_HEBREW,
  strategy: 'Unknown',
  strategyHebrew: UNKNOWN_HEBREW,
  authority: 'Unknown',
  authorityHebrew: UNKNOWN_HEBREW,
  profile: null,
  profileHebrew: null,
  definedCenters: [],
  undefinedCenters: [],
})

export function astrologyData(birthDate: string, birthTime?: string | null, birthPlace?: Place): AstrologyComputedData {
  const { lat, lng } = placeOrDefault(birthPlace)
  if (birthTime) {
    const chart = calculateNatalChart({ date: birthDate, time: birthTime, latitude: lat, longitude: lng })
    return {
      hasBirthTime: true,
      sunSign: chart.sunSign.id,
      moonSign: chart.moonSign.id,
      risingSign: chart.risingSign?.id || null,
      summary: {
        sunSignHebrew: chart.sunSign.hebrew,
        moonSignHebrew: chart.moonSign.hebrew,
        risingSignHebrew: chart.risingSign?.hebrew || null,
        dominantElement: dominant(chart.elementBalance),
        dominantModality: dominant(chart.modalityBalance),
      },
    }
  }

  const chart = calculateSunSignChart(birthDate, lat, lng)
  const moon = chart.planets.find((p) => p.planet.id === 'moon')
  return {
    hasBirthTime: false,
    sunSign: chart.sunSign.id,
    moonSign: moon?.sign.id || null,
    risingSign: null,
    summary: {
      sunSignHebrew: chart.sunSign.hebrew,
      moonSignHebrew: moon?.sign.hebrew || null,
      risingSignHebrew: null,
      dominantElement: 'unknown',
      dominantModality: 'unknown',
    },
  }
}

/** Null when the engine cannot cast the bodygraph. */
export function humanDesignData(birthDate: string, birthTime?: string | null, birthPlace?: Place): HumanDesignComputedData | null {
  const { lat, lng } = placeOrDefault(birthPlace)
  try {
    const result = calculateBodygraph({ birthDate, birthTime: birthTime || null, latitude: lat, longitude: lng })
    if (!result.hasBirthTime) return { ...NO_BIRTH_TIME_DESIGN, definedCenters: [], undefinedCenters: [] }
    const bodygraph = result as Bodygraph
    return {
      hasBirthTime: true,
      type: bodygraph.typeDefinition.name,
      typeHebrew: bodygraph.typeDefinition.nameHebrew,
      strategy: bodygraph.typeDefinition.strategy,
      strategyHebrew: bodygraph.typeDefinition.strategyHebrew,
      authority: bodygraph.authorityDefinition.name,
      authorityHebrew: bodygraph.authorityDefinition.nameHebrew,
      profile: bodygraph.profile.name,
      profileHebrew: bodygraph.profile.nameHebrew,
      definedCenters: [...bodygraph.definedCenters],
      undefinedCenters: [...bodygraph.undefinedCenters],
    }
  } catch (error) {
    console.error('Error computing Human Design:', error)
    return null
  }
}
