/**
 * SURPRISAL — how much a connection actually tells you.
 *
 * Every scoring scheme in the wild (astrology compatibility calculators, HD
 * "connection scores", Dreamspell match percentages) weights a hit by a
 * tradition-assigned constant: a `guide` is worth 18, an `electromagnetic` 12,
 * and so on, for everybody, forever. That is why our own numbers never varied
 * per pair and why the maps looked like decoration.
 *
 * The problem those schemes ignore is base rate. A tie that fires between 95%
 * of all humans is not evidence about two particular humans. A tie that fires
 * between 0.4% of them is.
 *
 * So we weight a hit by its SURPRISAL — the information-theoretic content of
 * observing it:
 *
 *     surprisal(t) = −log₂( P(t) )      [bits]
 *
 * An electromagnetic connection (P ≈ 0.954) carries 0.07 bits: nothing. An
 * exact Dreamspell guide (P ≈ 0.0038) carries 8.05 bits. The guide is therefore
 * ~115× more informative, and the arithmetic says so without anyone having to
 * assert it.
 *
 * BASE RATES ARE MEASURED, NOT ASSUMED. Every probability below was measured by
 * running this engine over random pairs — 7,140 pairs for the date-only systems
 * (Dreamspell, Tzolk'in) and 780 for those needing full birth data (Human
 * Design, astrology). Where a theoretical rate exists, the measurement agrees
 * with it (the exact oracle relations came in at 0.378–0.462% against a
 * combinatorial 0.385%). Sources and method: docs/redesign/CONNECTION_ATLAS.md.
 *
 * If you add a relation, MEASURE IT before you add it here. A guessed base rate
 * silently reintroduces exactly the problem this module exists to remove.
 */

/** Measured P(tie fires between two random people). */
export const BASE_RATE: Readonly<Record<string, number>> = Object.freeze({
  // ---- Dreamspell: the exact oracle. 1 in 260 each. ----
  'same-kin': 0.0046,
  guide: 0.0038,
  occult: 0.0041,
  analog: 0.0043,
  antipode: 0.0046,

  // ---- Dreamspell: seal-only echoes, and structure. ----
  'guide-seal': 0.037,
  'analog-seal': 0.044,
  'antipode-seal': 0.045,
  'occult-seal': 0.045,
  'same-seal': 0.050,
  'same-wavespell': 0.050,
  'same-tone': 0.080,
  'same-earth-family': 0.149,
  'same-castle': 0.155,
  'same-color': 0.202,

  // ---- Tzolk'in ----
  'trecena-match': 0.046,
  'same-sign': 0.049,
  'year-bearer': 0.057,
  'same-night-lord': 0.108,

  // ---- Gematria: the one sanctioned relation. Rare by construction. ----
  'name-value-match': 0.01,

  // ---- Human Design. Note how little most of these say. ----
  // Existence of a channel connection is near-universal; only companionship,
  // and the emergent/theme findings, carry any weight at all.
  companionship: 0.317,
  electromagnetic: 0.954,
  dominance: 0.963,
  compromise: 0.960,
  'emergent-center': 0.562,
  'split-bridge': 0.363,

  // ---- Astrology. The aspects say nothing; the rare contacts say everything.
  //
  // MEASURED, and two of them refute the literature outright:
  //
  //  * A 3-planet STELLIUM OVERLAY fires on 60.6% of pairs, not the ~4% the
  //    sources claim. Sun/Mercury/Venus are never more than ~76° apart and
  //    Placidus houses are wide, so three-in-a-house is close to the norm. The
  //    published "~4%" is really the FOUR-planet rate (measured 7.4%).
  //
  //  * A DOUBLE WHAMMY across all 15 planet pairs fires on 73.6% of pairs. The
  //    famous ~7-10% figure is per SPECIFIC pair — Sun–Moon 9.4%, Venus–Mars
  //    9.1%. So the generic tie is near-worthless and the canonical one is the
  //    headline. They are scored as different things, because they are.
  'cross-aspect': 1.0,
  'house-overlay': 1.0,
  'tight-aspect': 0.831,
  element: 0.764,
  'double-whammy': 0.736, // any planet pair — common, therefore quiet
  'stellium-overlay': 0.606, // 3+ planets. 4+ is 0.074; 5+ is 0.001
  'angle-contact': 0.497,
  'node-contact': 0.281,
  'double-whammy-core': 0.094, // Sun–Moon or Venus–Mars, reciprocal. THE headline.
  'node-axis-integration': 0.078,
  'vertex-contact': 0.058,
})

/**
 * Bits of information carried by observing this tie.
 *
 * An unknown tie is treated as a coin flip (1 bit) rather than as a discovery —
 * we do not reward a relation for being unmeasured.
 */
export function surprisal(type: string): number {
  const p = BASE_RATE[type]
  if (p === undefined) return 1
  if (p >= 1) return 0 // fires for everyone: zero information, by definition
  if (p <= 0) return 0
  return -Math.log2(p)
}

/** Ranks ties by what they actually tell you. Most informative first. */
export function bySurprisal(a: { type: string }, b: { type: string }): number {
  return surprisal(b.type) - surprisal(a.type)
}

/**
 * How surprising is this *set* of ties, as one number?
 *
 * Summing bits assumes the ties are independent, which they are not — a
 * `same-wavespell` implies a `same-castle`, and an exact `analog` implies an
 * `analog-seal`. So we take the single most informative tie and add a damped
 * contribution from the rest. This deliberately refuses to let a pile of
 * near-universal ties (three electromagnetics, twenty aspects) add up to a
 * finding.
 */
export function rarityBits(ties: readonly { type: string }[]): number {
  if (ties.length === 0) return 0
  const bits = ties.map((t) => surprisal(t.type)).sort((x, y) => y - x)
  return bits.reduce((total, b, i) => total + b / (i + 1), 0)
}

/**
 * The rarity of a pair as a 0-100 score.
 *
 * Anchored so that a pair with nothing but the universal ties scores near 0,
 * and a pair carrying an exact oracle relation (8+ bits) lands in the 70s-90s.
 * This is a rank, not a verdict: it says how unusual this pairing is, and
 * explicitly NOT how good it is. Nothing in any of these traditions licenses
 * "good".
 */
export function rarityScore(ties: readonly { type: string }[]): number {
  const bits = rarityBits(ties)
  // 12 bits ≈ everything we can currently observe firing at once.
  return Math.round(Math.min(100, (bits / 12) * 100))
}
