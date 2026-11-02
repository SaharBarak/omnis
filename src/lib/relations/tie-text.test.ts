import { describe, expect, it } from 'vitest'
import { BASE_RATE } from '@pleiad/engine/services/rarity'
import { centerName, type Tie } from './pair-ties'
import { tieBetween, tieName, tieOdds } from './tie-text'

const tie = (over: Partial<Tie>): Tie => ({
  system: 'dreamspell',
  from: 'maya',
  to: 'ari',
  type: 'guide',
  meaning: '',
  harmony: 'supportive',
  score: 0,
  bits: 8,
  baseRate: 0.0038,
  tier: 'T3',
  acts: { by: 'ari', on: 'maya' },
  ...over,
})

const names: Record<string, string> = { maya: 'Maya', ari: 'Ari' }

describe('tie text', () => {
  it('states direction for the guide', () => {
    expect(tieBetween(tie({}), (id) => names[id])).toBe("Ari is Maya's guide")
  })

  it('names planets and centres', () => {
    expect(tieName(tie({ type: 'double-whammy-core', planets: ['sun', 'moon'], acts: null }), centerName)).toBe('Double whammy core: Sun and Moon')
    expect(tieName(tie({ type: 'emergent-center', channel: 'solar', acts: null }), centerName)).toBe('Emergent center: Solar Plexus')
  })

  it('writes odds from the measured base rate', () => {
    expect(tieOdds(BASE_RATE['electromagnetic'])).toMatch(/% of pairs$/)
    expect(tieOdds(0.0038)).toBe('1 in 263')
  })
})
