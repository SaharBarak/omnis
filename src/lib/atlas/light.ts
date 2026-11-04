import { missingForExact } from './birth-input'
import { buildLongCount } from './long-count'
import { buildMaya } from './maya'
import { buildNumber } from './number'
import { buildReadout } from './readout'
import type { BirthInput, BodyLayer, LightAtlas, PersonAtlas, SkyLayer } from './types'

/** Light half of the atlas: data tables only, safe to bundle with any page. */

export const isoDay = (d: Date): string => d.toISOString().slice(0, 10)

export function buildLightAtlas(input: BirthInput, today: string): LightAtlas {
  return { input, maya: buildMaya(input.date), number: buildNumber(input.date, input.name, today), longCount: buildLongCount(input.date) }
}

export function composeAtlas(light: LightAtlas, sky: SkyLayer, body: BodyLayer | null): PersonAtlas {
  const needs = missingForExact(light.input)
  return {
    ...light,
    sky,
    body,
    bodyNeeds: body ? null : needs,
    readout: buildReadout(sky, light.maya, body, light.number, needs),
  }
}
