import { HOUSES } from '@pleiad/engine/data/houses'
import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { GATES } from '@pleiad/engine/data/human-design-gates'
import { PLANETS } from '@pleiad/engine/data/planets'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { andList, capital, centreName, MARK_LAYER, markTitle, rolesOf, type AtlasMarkKind, type AtlasMarkRef, type MarkSource, type MarkTitle } from './marks'
import type { AtlasLayerId } from './types'
import { getSealMeaning, getToneMeaning } from '@/lib/dreamspell-meanings'

/**
 * What the tradition reads into a mark on the atlas (docs/redesign/BENTO_SITE.md,
 * "Marks explain themselves"). Pure and server-safe. The card's head is the
 * mark's title from marks.ts; this adds the meaning and the facts, every line
 * from a table the product already reads. A source with nothing for a mark
 * leaves that line out. The browser loads this module after first paint.
 */

export interface MarkFact {
  readonly label: string
  readonly value: string
}

/** What explain adds to a mark's title. */
export interface MarkReading {
  readonly meaning: string | null
  readonly facts: readonly MarkFact[]
}

export interface MarkExplanation extends MarkTitle, MarkReading {
  readonly layer: AtlasLayerId
  readonly kind: AtlasMarkKind
}

/** Keywords as one sentence: `Identity, vitality, ego.` */
const sentence = (words: readonly string[]): string | null => (words.length === 0 ? null : `${capital(words.join(', '))}.`)

/** Sentences joined, the empty ones left out. */
const prose = (...parts: readonly (string | null)[]): string | null => parts.filter(Boolean).join(' ') || null

const fact = (label: string, value: string): MarkFact => ({ label, value })

const NOTHING: MarkReading = { meaning: null, facts: [] }

function reading(atlas: MarkSource, ref: AtlasMarkRef): MarkReading {
  switch (ref.kind) {
    case 'planet': {
      const planet = PLANETS.find((p) => p.id === ref.id)
      return planet ? { meaning: sentence(planet.keywords), facts: [fact('Kind', capital(planet.type))] } : NOTHING
    }
    case 'sign': {
      const sign = ZODIAC_SIGNS.find((z) => z.id === ref.id)
      if (!sign) return NOTHING
      const ruler = PLANETS.find((p) => p.id === sign.ruler)?.name ?? capital(sign.ruler)
      return {
        meaning: sentence(sign.keywords),
        facts: [fact('Element', capital(sign.element)), fact('Modality', capital(sign.modality)), fact('Ruler', ruler)],
      }
    }
    case 'rising': {
      const first = HOUSES[0]
      return { meaning: prose(`${first.theme}.`, sentence(first.keywords)), facts: [fact('House', first.name)] }
    }
    case 'seal': {
      const seal = getSealMeaning(ref.n)
      return {
        meaning: rolesOf(atlas.maya, ref.n)[0]?.description ?? null,
        facts: [fact('Power', seal.power), fact('Action', seal.action), fact('Essence', seal.essence)],
      }
    }
    case 'tone': {
      const tone = getToneMeaning(atlas.maya.tone.n)
      return { meaning: null, facts: [fact('Action', tone.action), fact('Power', tone.power), fact('Phase', tone.phase)] }
    }
    case 'centre': {
      const centre = CENTERS.find((c) => c.id === ref.id)
      if (!centre) return NOTHING
      const open = !atlas.body?.definedCenters.includes(ref.id)
      return { meaning: centre.function, facts: open ? [fact('Not-self', centre.notSelfTheme)] : [] }
    }
    case 'channel': {
      const channel = CHANNELS.find((c) => c.id === ref.id)
      return channel
        ? { meaning: sentence(channel.keywords), facts: [fact('Joins', andList(channel.centers.map(centreName))), fact('Circuit', capital(channel.circuitry))] }
        : NOTHING
    }
    case 'gate': {
      const gate = GATES.find((g) => g.number === ref.n)
      return gate ? { meaning: prose(`${gate.name}.`, sentence(gate.keywords)), facts: [] } : NOTHING
    }
  }
}

/** The card for one mark of this atlas, or null when the atlas does not draw it. */
export function explain(atlas: MarkSource, ref: AtlasMarkRef): MarkExplanation | null {
  const title = markTitle(atlas, ref)
  return title ? { ...title, layer: MARK_LAYER[ref.kind], kind: ref.kind, ...reading(atlas, ref) } : null
}
