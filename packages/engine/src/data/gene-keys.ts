/**
 * The 64 Gene Keys (#75) — the Spectrum of Consciousness keyword triples
 * (Shadow → Gift → Siddhi) as widely published; Gene Key n corresponds to
 * I Ching hexagram n and Human Design gate n.
 */

export interface GeneKey {
  /** 1-64, aligned with hexagram and HD gate numbering. */
  readonly key: number
  readonly shadow: string
  readonly gift: string
  readonly siddhi: string
}

const TRIPLES: readonly (readonly [string, string, string])[] = [
  ['Entropy', 'Freshness', 'Beauty'],
  ['Dislocation', 'Orientation', 'Unity'],
  ['Chaos', 'Innovation', 'Innocence'],
  ['Intolerance', 'Understanding', 'Forgiveness'],
  ['Impatience', 'Patience', 'Timelessness'],
  ['Conflict', 'Diplomacy', 'Peace'],
  ['Division', 'Guidance', 'Virtue'],
  ['Mediocrity', 'Style', 'Exquisiteness'],
  ['Inertia', 'Determination', 'Invincibility'],
  ['Self-Obsession', 'Naturalness', 'Being'],
  ['Obscurity', 'Idealism', 'Light'],
  ['Vanity', 'Discrimination', 'Purity'],
  ['Discord', 'Discernment', 'Empathy'],
  ['Compromise', 'Competence', 'Bounteousness'],
  ['Dullness', 'Magnetism', 'Florescence'],
  ['Indifference', 'Versatility', 'Mastery'],
  ['Opinion', 'Far-Sightedness', 'Omniscience'],
  ['Judgment', 'Integrity', 'Perfection'],
  ['Co-Dependence', 'Sensitivity', 'Sacrifice'],
  ['Superficiality', 'Self-Assurance', 'Presence'],
  ['Control', 'Authority', 'Valor'],
  ['Dishonor', 'Graciousness', 'Grace'],
  ['Complexity', 'Simplicity', 'Quintessence'],
  ['Addiction', 'Invention', 'Silence'],
  ['Constriction', 'Acceptance', 'Universal Love'],
  ['Pride', 'Artfulness', 'Invisibility'],
  ['Selfishness', 'Altruism', 'Selflessness'],
  ['Purposelessness', 'Totality', 'Immortality'],
  ['Half-Heartedness', 'Commitment', 'Devotion'],
  ['Desire', 'Lightness', 'Rapture'],
  ['Arrogance', 'Leadership', 'Humility'],
  ['Failure', 'Preservation', 'Veneration'],
  ['Forgetting', 'Mindfulness', 'Revelation'],
  ['Force', 'Strength', 'Majesty'],
  ['Hunger', 'Adventure', 'Boundlessness'],
  ['Turbulence', 'Humanity', 'Compassion'],
  ['Weakness', 'Equality', 'Tenderness'],
  ['Struggle', 'Perseverance', 'Honor'],
  ['Provocation', 'Dynamism', 'Liberation'],
  ['Exhaustion', 'Resolve', 'Divine Will'],
  ['Fantasy', 'Anticipation', 'Emanation'],
  ['Expectation', 'Detachment', 'Celebration'],
  ['Deafness', 'Insight', 'Epiphany'],
  ['Interference', 'Teamwork', 'Synarchy'],
  ['Dominance', 'Synergy', 'Communion'],
  ['Seriousness', 'Delight', 'Ecstasy'],
  ['Oppression', 'Transmutation', 'Transfiguration'],
  ['Inadequacy', 'Resourcefulness', 'Wisdom'],
  ['Reaction', 'Revolution', 'Rebirth'],
  ['Corruption', 'Equilibrium', 'Harmony'],
  ['Agitation', 'Initiative', 'Awakening'],
  ['Stress', 'Restraint', 'Stillness'],
  ['Immaturity', 'Expansion', 'Superabundance'],
  ['Greed', 'Aspiration', 'Ascension'],
  ['Victimization', 'Freedom', 'Freedom'],
  ['Distraction', 'Enrichment', 'Intoxication'],
  ['Unease', 'Intuition', 'Clarity'],
  ['Dissatisfaction', 'Vitality', 'Bliss'],
  ['Dishonesty', 'Intimacy', 'Transparency'],
  ['Limitation', 'Realism', 'Justice'],
  ['Psychosis', 'Inspiration', 'Sanctity'],
  ['Intellect', 'Precision', 'Impeccability'],
  ['Doubt', 'Inquiry', 'Truth'],
  ['Confusion', 'Imagination', 'Illumination'],
]

export const GENE_KEYS: readonly GeneKey[] = Object.freeze(
  TRIPLES.map(([shadow, gift, siddhi], i) => ({ key: i + 1, shadow, gift, siddhi }))
)

export function getGeneKey(key: number): GeneKey {
  const found = GENE_KEYS[key - 1]
  if (!found) throw new Error(`gene key out of range: ${key}`)
  return found
}
