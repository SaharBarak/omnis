/**
 * Per-seal and per-tone Dreamspell meanings for daily interpretation.
 *
 * Every attribute and paragraph here is grounded in the learn-content
 * knowledge base (src/lib/docs/content.ts — dreamspellDocs.seals.sealDetails,
 * dreamspellDocs.seals.colorFamilies, dreamspellDocs.tones.toneDetails,
 * dreamspellDocs.wavespells.structure) and matches the engine's canonical
 * Argüelles attributes (packages/engine/src/data/mantras.ts). The paragraphs
 * restate the power / action / essence / keywords those sources already
 * assign — no new attributes are invented. Keep in sync with content.ts.
 */

export interface SealMeaning {
  /** Solar seal number, 1–20. */
  readonly number: number
  /** Full color + archetype name, e.g. 'Red Dragon'. */
  readonly name: string
  /** What it does (Argüelles: Power). */
  readonly power: string
  /** How it operates (Argüelles: Action). */
  readonly action: string
  /** Its fundamental quality (Argüelles: Essence). */
  readonly essence: string
  /** 2–3 sentence interpretation, written to follow a bolded name lead-in. */
  readonly paragraph: string
}

export interface ToneMeaning {
  /** Galactic tone number, 1–13. */
  readonly number: number
  /** Tone name, e.g. 'Magnetic'. */
  readonly name: string
  /** The tone's verb, e.g. 'Unify'. */
  readonly action: string
  /** The tone's power, e.g. 'Attract'. */
  readonly power: string
  /** Wavespell phase for this tone's day, e.g. 'Purpose'. */
  readonly phase: string
  /** 2–3 sentence interpretation, written to follow a bolded name lead-in. */
  readonly paragraph: string
}

export const SEAL_MEANINGS: readonly SealMeaning[] = Object.freeze([
  {
    number: 1,
    name: 'Red Dragon',
    power: 'Birth',
    action: 'Nurtures',
    essence: 'Being',
    paragraph:
      'The power of Birth: primal trust, nurturance, the energy of new beginnings. Dragon nurtures whatever is just emerging, and its essence is Being: existence before doing. As a Red seal of the East, it opens cycles, the spark that starts things.',
  },
  {
    number: 2,
    name: 'White Wind',
    power: 'Spirit',
    action: 'Communicates',
    essence: 'Breath',
    paragraph:
      'The power of Spirit, whose action is to communicate. Wind is the divine messenger, carrying inspiration and truth, and its essence is Breath: the invisible current that animates speech and life alike. A White seal of the North, it refines what has begun by clarifying the message.',
  },
  {
    number: 3,
    name: 'Blue Night',
    power: 'Abundance',
    action: 'Dreams',
    essence: 'Intuition',
    paragraph:
      'The power of Abundance, whose action is to dream. Night works in the unconscious (the dark, fertile store of dreams and inner knowing), and its essence is Intuition. A Blue seal of the West, it transforms things in its depths.',
  },
  {
    number: 4,
    name: 'Yellow Seed',
    power: 'Flowering',
    action: 'Targets',
    essence: 'Awareness',
    paragraph:
      'The power of Flowering, whose action is to target: aiming potential at the ground where it can grow. Seed carries fertility and the planting of ideas; its essence is Awareness, the seed’s quiet knowledge of what it will become. A Yellow seal of the South, it ripens the cycle toward harvest.',
  },
  {
    number: 5,
    name: 'Red Serpent',
    power: 'Life Force',
    action: 'Survives',
    essence: 'Instinct',
    paragraph:
      'The power of Life Force: kundalini, passion, the body’s own wisdom. Serpent’s action is to survive, and its essence is Instinct: knowing that lives below thought. A Red seal of the East, it initiates from the body up.',
  },
  {
    number: 6,
    name: 'White World-Bridger',
    power: 'Death',
    action: 'Equalizes',
    essence: 'Opportunity',
    paragraph:
      'The power of Death, understood as a crossing rather than an ending. World-Bridger acts by equalizing (surrender and release level what was held too tightly), and its essence is Opportunity, the opening that appears once something is let go. A White seal of the North, it refines by clearing.',
  },
  {
    number: 7,
    name: 'Blue Hand',
    power: 'Accomplishment',
    action: 'Knows',
    essence: 'Healing',
    paragraph:
      'The power of Accomplishment, whose action is to know: knowledge that lives in craft and in the healing touch. Hand’s essence is Healing: work done with skill mends what it handles. A Blue seal of the West, it transforms through what it makes.',
  },
  {
    number: 8,
    name: 'Yellow Star',
    power: 'Elegance',
    action: 'Beautifies',
    essence: 'Art',
    paragraph:
      'The power of Elegance, whose action is to beautify. Star carries beauty, harmony, and artistic expression; its essence is Art: shaping things until they shine. A Yellow seal of the South, it ripens the cycle into something worth beholding.',
  },
  {
    number: 9,
    name: 'Red Moon',
    power: 'Universal Water',
    action: 'Purifies',
    essence: 'Flow',
    paragraph:
      'The power of Universal Water, whose action is to purify: emotion moving through until it runs clear. Moon’s essence is Flow, and its gift is receptivity: letting what comes, come. A Red seal of the East, it begins cycles by washing the ground clean.',
  },
  {
    number: 10,
    name: 'White Dog',
    power: 'Heart',
    action: 'Loves',
    essence: 'Loyalty',
    paragraph:
      'The power of Heart, whose action is simply to love. Dog carries unconditional love and devotion; its essence is Loyalty: love that stays. A White seal of the North, it refines everything down to what the heart actually holds.',
  },
  {
    number: 11,
    name: 'Blue Monkey',
    power: 'Magic',
    action: 'Plays',
    essence: 'Illusion',
    paragraph:
      'The power of Magic, whose action is to play: the inner child and the divine trickster in one. Monkey’s essence is Illusion: play tells the truth precisely by refusing to take appearances seriously. A Blue seal of the West, it transforms through mischief and delight.',
  },
  {
    number: 12,
    name: 'Yellow Human',
    power: 'Free Will',
    action: 'Influences',
    essence: 'Wisdom',
    paragraph:
      'The power of Free Will, whose action is to influence. Human is the wisdom vessel, and its essence is Wisdom, earned one choice at a time. A Yellow seal of the South, it ripens the cycle through the responsibility of choosing.',
  },
  {
    number: 13,
    name: 'Red Skywalker',
    power: 'Space',
    action: 'Explores',
    essence: 'Wakefulness',
    paragraph:
      'The power of Space, whose action is to explore: expansion, and a bridge between worlds. Skywalker’s essence is Wakefulness: the explorer’s alertness to what is actually there. A Red seal of the East, it initiates by stepping first into the unknown.',
  },
  {
    number: 14,
    name: 'White Wizard',
    power: 'Timelessness',
    action: 'Enchants',
    essence: 'Receptivity',
    paragraph:
      'The power of Timelessness, whose action is to enchant. Wizard’s essence is Receptivity: the magician’s stillness, a heart-knowing that draws things in rather than chasing them. A White seal of the North, it refines by holding still until the essential appears.',
  },
  {
    number: 15,
    name: 'Blue Eagle',
    power: 'Vision',
    action: 'Creates',
    essence: 'Mind',
    paragraph:
      'The power of Vision, whose action is to create: seeing far enough that the seeing becomes commitment. Eagle’s essence is Mind, the planetary mind that holds the whole picture. A Blue seal of the West, it transforms by viewing from above.',
  },
  {
    number: 16,
    name: 'Yellow Warrior',
    power: 'Intelligence',
    action: 'Questions',
    essence: 'Fearlessness',
    paragraph:
      'The power of Intelligence, whose action is to question: the inner quest pursued with courage. Warrior’s essence is Fearlessness: not the absence of fear but the willingness to ask anyway. A Yellow seal of the South, it ripens the cycle by testing it.',
  },
  {
    number: 17,
    name: 'Red Earth',
    power: 'Navigation',
    action: 'Evolves',
    essence: 'Synchronicity',
    paragraph:
      'The power of Navigation, whose action is to evolve. Earth’s essence is Synchronicity: grounded, centered attention that reads the signs as they align. A Red seal of the East, it initiates by orienting: know where you stand before you move.',
  },
  {
    number: 18,
    name: 'White Mirror',
    power: 'Endlessness',
    action: 'Reflects',
    essence: 'Order',
    paragraph:
      'The power of Endlessness, whose action is to reflect: truth shown back without distortion. Mirror’s essence is Order: the clean geometry underneath appearances. A White seal of the North, it refines by showing things exactly as they are.',
  },
  {
    number: 19,
    name: 'Blue Storm',
    power: 'Self-Generation',
    action: 'Catalyzes',
    essence: 'Energy',
    paragraph:
      'The power of Self-Generation, whose action is to catalyze: transformation that feeds on its own energy. Storm’s essence is Energy, and its promise is rebirth: what it takes apart, it recharges. A Blue seal of the West, it is the transformer at full strength.',
  },
  {
    number: 20,
    name: 'Yellow Sun',
    power: 'Universal Fire',
    action: 'Enlightens',
    essence: 'Life',
    paragraph:
      'The power of Universal Fire, whose action is to enlighten. Sun carries enlightenment, ascension, and wholeness; its essence is Life itself. The final Yellow seal of the South, it ripens the whole cycle to completion: what the other seals began comes to light here.',
  },
])

export const TONE_MEANINGS: readonly ToneMeaning[] = Object.freeze([
  {
    number: 1,
    name: 'Magnetic',
    action: 'Unify',
    power: 'Attract',
    phase: 'Purpose',
    paragraph:
      'The tone of Purpose: the first day of a wavespell. Magnetic initiates and attracts: everything the next thirteen days will become gathers around the intention named now. Its action is to unify, drawing the scattered pieces around one central theme.',
  },
  {
    number: 2,
    name: 'Lunar',
    action: 'Polarize',
    power: 'Stabilize',
    phase: 'Challenge',
    paragraph:
      'The tone of Challenge. Lunar reveals polarity (the obstacle standing opposite the purpose) and shows what needs to be stabilized. Its action is to polarize: naming the tension is what makes the tension workable.',
  },
  {
    number: 3,
    name: 'Electric',
    action: 'Activate',
    power: 'Bond',
    phase: 'Service',
    paragraph:
      'The tone of Service. Electric activates: things start to move, and separate elements bond into working relationships. Its spark turns intention into motion, best spent in service to something beyond yourself.',
  },
  {
    number: 4,
    name: 'Self-Existing',
    action: 'Define',
    power: 'Measure',
    phase: 'Form',
    paragraph:
      'The tone of Form. Self-Existing defines: the shape of the thing emerges, the foundation is laid, and what is needed gets measured. Its action is to give the purpose a body it can live in.',
  },
  {
    number: 5,
    name: 'Overtone',
    action: 'Empower',
    power: 'Command',
    phase: 'Radiance',
    paragraph:
      'The tone of Radiance. Overtone commands empowerment (energy radiating from the center outward) and it asks for leadership. Its action is to empower: take your place at the center of what you started.',
  },
  {
    number: 6,
    name: 'Rhythmic',
    action: 'Organize',
    power: 'Balance',
    phase: 'Equality',
    paragraph:
      'The tone of Equality. Rhythmic organizes and balances, administering resources so the whole moves at a sustainable pace. Its action is practical: bring the uneven parts of the work back into rhythm.',
  },
  {
    number: 7,
    name: 'Resonant',
    action: 'Channel',
    power: 'Inspire',
    phase: 'Attunement',
    paragraph:
      'The tone of Attunement: the exact midpoint of the wavespell. Resonant attunes to the center and channels inspiration; it holds mystical knowing rather than effort. Its action is to channel: listen for what wants to move through you.',
  },
  {
    number: 8,
    name: 'Galactic',
    action: 'Harmonize',
    power: 'Model',
    phase: 'Integrity',
    paragraph:
      'The tone of Integrity. Galactic harmonizes (bringing action and belief into agreement) and it models: living the pattern is how the pattern spreads. Do the thing the way you believe things should be done.',
  },
  {
    number: 9,
    name: 'Solar',
    action: 'Pulse',
    power: 'Realize',
    phase: 'Intention',
    paragraph:
      'The tone of Intention in motion. Solar pulses intention into realization: this is the tone that makes things happen. The momentum of the wavespell crests here.',
  },
  {
    number: 10,
    name: 'Planetary',
    action: 'Perfect',
    power: 'Produce',
    phase: 'Manifestation',
    paragraph:
      'The tone of Manifestation. Planetary perfects and produces: the intended result actually arrives. Its action is to perfect: finish the work and make it real in the world.',
  },
  {
    number: 11,
    name: 'Spectral',
    action: 'Dissolve',
    power: 'Release',
    phase: 'Liberation',
    paragraph:
      'The tone of Liberation. Spectral dissolves and releases, liberating whatever no longer serves the cycle. After manifestation, the scaffolding that got you here can be set down.',
  },
  {
    number: 12,
    name: 'Crystal',
    action: 'Dedicate',
    power: 'Universalize',
    phase: 'Cooperation',
    paragraph:
      'The tone of Cooperation. Crystal dedicates the work to universal sharing: what was made by one becomes useful to many. Its action is to universalize: bring others in and let the result settle into something collective.',
  },
  {
    number: 13,
    name: 'Cosmic',
    action: 'Endure',
    power: 'Transcend',
    phase: 'Presence',
    paragraph:
      'The tone of Presence: the last day of a wavespell. Cosmic endures and transcends, carrying what the cycle taught beyond the cycle itself. Its action is to transcend: hold presence with what is complete, ready for the next Magnetic beginning.',
  },
])

export function getSealMeaning(sealNumber: number): SealMeaning {
  const meaning = SEAL_MEANINGS[sealNumber - 1]
  if (!meaning) {
    throw new RangeError(`Invalid seal number: ${sealNumber}`)
  }
  return meaning
}

export function getToneMeaning(toneNumber: number): ToneMeaning {
  const meaning = TONE_MEANINGS[toneNumber - 1]
  if (!meaning) {
    throw new RangeError(`Invalid tone number: ${toneNumber}`)
  }
  return meaning
}

/**
 * One sentence on how this tone and seal combine into a Kin.
 * Grounded in the learn content's framing: tones describe HOW the energy
 * of a solar seal expresses itself — one tone + one seal = one Kin.
 */
export function composeKinCombination(sealNumber: number, toneNumber: number): string {
  const seal = getSealMeaning(sealNumber)
  const tone = getToneMeaning(toneNumber)
  return `Together they name the day: the ${tone.name} tone sets how the energy moves (to ${tone.action.toLowerCase()}), and ${seal.name} gives it what to move with: the power of ${seal.power}.`
}
