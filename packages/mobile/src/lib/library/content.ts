/**
 * Bundled library content — S14/F10. A trimmed mobile copy of the six
 * knowledge docs so the codex reads fully offline.
 *
 * CANONICAL SOURCE: src/lib/docs/content.ts (web). This file condenses that
 * text faithfully — no invented claims. When the web codex changes, update
 * this copy by hand. Lineage lines come from src/lib/design/system-flavors.ts.
 */

import { FLAVORS, type SystemFlavor } from '@/theme/tokens'

/** Route segment for /learn/[system] — matches the web /learn/* slugs. */
export type LibrarySystemKey =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'human-design'
  | 'gematria'
  | 'integration'

export interface LibrarySection {
  title: string
  body: string
}

export interface LibraryDoc {
  key: LibrarySystemKey
  /** Display name — matches the flavor name. */
  name: string
  title: string
  /** One-line lineage note (system-flavors.ts). */
  lineage: string
  intro: string[]
  sections: LibrarySection[]
  flavor: SystemFlavor
}

export const LIBRARY_ORDER: readonly LibrarySystemKey[] = [
  'dreamspell',
  'tzolkin',
  'astrology',
  'human-design',
  'gematria',
  'integration',
] as const

export const LIBRARY_DOCS: Readonly<Record<LibrarySystemKey, LibraryDoc>> = {
  dreamspell: {
    key: 'dreamspell',
    name: 'Dreamspell',
    title: 'Dreamspell: The Galactic Calendar',
    lineage:
      'In the Dreamspell, no kin stands alone: every sign has its guide, its antipode, its occult ally.',
    intro: [
      'Dreamspell is a synchronic timing system developed by José Argüelles and Lloydine Argüelles in 1987. It reinterprets the ancient Mayan Tzolkin through a contemporary lens: a way to step out of linear, mechanical time and into cyclical, natural time.',
      'Where the Gregorian calendar runs on what Argüelles called the 12:60 frequency, Dreamspell runs on 13:20: thirteen tones by twenty seals, 260 unique days called Kin. Your Galactic Signature is the Kin of your birthday.',
    ],
    sections: [
      {
        title: 'The 20 Solar Seals',
        body: 'The seals are archetypal forces describing the essential nature of each day (and, on your birthday, a core aspect of you). Each carries a power, an action and an essence, and belongs to one of four color families: Red initiates in the East, White refines in the North, Blue transforms in the West, Yellow ripens in the South.',
      },
      {
        title: 'The 13 Galactic Tones',
        body: 'The tones are stages in a creative cycle, from Magnetic (unify, attract, purpose) through Solar (pulse intention into realization) to Cosmic (endure, transcend). They describe HOW the energy of a seal expresses itself: one tone plus one seal makes one Kin.',
      },
      {
        title: 'Wavespells',
        body: 'A wavespell is a 13-day journey through all thirteen tones under one seal: day one sets the intention at the Magnetic Gate, the middle days develop and transform it, day thirteen carries it beyond the cycle. Twenty wavespells complete a Tzolkin spin.',
      },
      {
        title: 'The Oracle',
        body: 'Every Kin sits at the center of a five-part oracle: the Destiny Kin, its Guide (higher wisdom of the same color), its Analog (support, seal numbers summing to 19), its Antipode (the challenge ten seals away), and its Occult (hidden power, seals summing to 21). No kin operates in isolation.',
      },
      {
        title: 'Daily practice',
        body: "Check the day's Kin each morning and set an intention aligned with its seal and tone. Know where you stand in the wavespell. Calculate the Kins of people close to you and see where they sit in your oracle. Your galactic return (your Kin recurring) arrives every 260 days.",
      },
    ],
    flavor: FLAVORS.dreamspell,
  },

  tzolkin: {
    key: 'tzolkin',
    name: 'Tzolkin',
    title: 'Traditional Tzolkin: The Living Maya Calendar',
    lineage: 'The Maya kept day-counts on bark paper for generations. This codex is yours.',
    intro: [
      'The Tzolkin ("count of days") is the 260-day sacred calendar kept continuously by Maya peoples for over 2,500 years. Unlike Dreamspell, a modern reinterpretation, the traditional count is still held by Maya daykeepers (Aj Q\'ijab\') in Guatemala and the surrounding regions.',
      'Twenty day names (nawales) combine with thirteen numbers into 260 unique day-signs. The count has never been broken, maintained across centuries of colonization and suppression.',
    ],
    sections: [
      {
        title: 'Tzolkin and Dreamspell',
        body: 'The two systems use different correlations, so the same calendar date shows different signs in each. Neither is wrong: they are parallel traditions. The traditional count serves divination, ceremony and life guidance; Dreamspell was built for global synchronization. The traditional count includes leap days; Dreamspell treats February 29 as a day out of time.',
      },
      {
        title: 'The 20 Nawales',
        body: 'Each nawal is an energetic archetype with animal associations, a direction and specific gifts: Imix, the primordial waters; Iq\', wind and breath; Kame, transformation and the ancestors; B\'atz\', the thread that weaves time; Tz\'ikin, the eagle\'s vision; Ajpu, the lord sun of completion, twenty in all, cycling east, north, west, south.',
      },
      {
        title: 'The 13 numbers',
        body: 'The numbers one through thirteen modify the day sign: one is beginning and potential, four is the stability of the four directions, seven is culmination and reflection, nine is patience and feminine power, thirteen is transformation and cosmic consciousness.',
      },
      {
        title: 'Ceremonial use today',
        body: 'Daykeepers read birth signs (Cholq\'ij) to understand a person\'s gifts and purpose, divine with red beans and crystals, time fire ceremonies and healing rituals to auspicious days, compare partners\' signs, and align planting with the count. The practice lives in community and in relationship with land and cosmos.',
      },
    ],
    flavor: FLAVORS.tzolkin,
  },

  astrology: {
    key: 'astrology',
    name: 'Astrology',
    title: 'Astrology: The Cosmic Language',
    lineage:
      'From the Uranographia atlases to the modern ephemeris: the sky, engraved.',
    intro: [
      "Astrology is humanity's oldest system for reading the relationship between celestial patterns and earthly events, at least 4,000 years old, refined by Babylonian, Egyptian, Greek, Persian, Arabic, Indian and Chinese civilizations.",
      'Pleiad uses Western tropical astrology: your natal chart is a snapshot of the sky at your exact moment of birth, seen from your birthplace. Modern astrology is psychological and archetypal: the planets describe parts of your psyche, the signs how they express, the houses where in life they play out.',
    ],
    sections: [
      {
        title: 'The Big Three',
        body: 'Your Sun sign is your core identity: the central organizing principle you grow into. Your Moon sign is your emotional operating system: what you need to feel safe, how you instinctively react. Your Rising sign, the sign on the eastern horizon at birth, is your approach to the world and sets the structure of your whole chart.',
      },
      {
        title: 'Signs, elements, modalities',
        body: 'The twelve signs organize by element (Fire acts and inspires, Earth stabilizes, Air connects ideas, Water feels and intuits) and by modality: Cardinal signs initiate, Fixed signs sustain, Mutable signs adapt. Every sign is one element crossed with one modality.',
      },
      {
        title: 'The planets',
        body: 'Each planet is a psychological function: the Sun and Moon carry core identity; Mercury, Venus and Mars run day-to-day thinking, relating and acting; Jupiter expands and Saturn structures; Uranus, Neptune and Pluto move slowly, shaping generations through awakening, dissolution and transformation.',
      },
      {
        title: 'Houses and aspects',
        body: "The twelve houses divide the chart into life areas: identity, resources, communication, home, creativity, service, partnership, transformation, philosophy, career, community, the unconscious. Houses need an accurate birth time. Aspects are angular conversations between planets: conjunctions blend, trines flow, squares and oppositions create the friction that drives growth.",
      },
      {
        title: 'Reading a chart',
        body: 'Start with the overall balance of elements and modalities, then the Big Three, then the personal planets by sign and house. Read the tightest aspects first (they speak loudest) and weave the repeating themes into one coherent narrative.',
      },
    ],
    flavor: FLAVORS.astrology,
  },

  'human-design': {
    key: 'human-design',
    name: 'Human Design',
    title: 'Human Design: Your Energetic Blueprint',
    lineage: 'Human Design maps the channels that only exist when two people stand together.',
    intro: [
      'Human Design was transmitted to Ra Uru Hu in 1987: a synthesis of Western astrology, the I Ching, the chakra system and the Kabbalistic Tree of Life, unified through modern genetics. "I am not the guru," he said. "I am a mechanic."',
      "Your Bodygraph is calculated from your exact birth date, time and place. It doesn't say what you should do. It describes how you're designed to operate: how to make decisions, interact and find your correct path.",
    ],
    sections: [
      {
        title: 'The five Types',
        body: 'Type is the most fundamental layer. Manifestors (~9%) initiate and must inform. Generators (~37%) carry sustainable life force and wait to respond. Manifesting Generators (~33%) respond, then move fast and inform. Projectors (~20%) guide others and wait for the invitation. Reflectors (~1%) mirror their community and give big decisions a full lunar cycle.',
      },
      {
        title: 'Strategy and signature',
        body: "Each Type has a strategy and a pair of emotional tells: Generators move between frustration and satisfaction, Manifestors between anger and peace, Projectors between bitterness and success, Reflectors between disappointment and surprise. The not-self theme is the signal you're off track; the signature says you're living your design.",
      },
      {
        title: 'Inner Authority',
        body: "Authority is how you decide: with the body, not the mind. Emotional authority (about half of people) rides the wave and waits for clarity; Sacral authority answers in the moment with a gut yes or no; Splenic authority is quiet instinct that speaks once. Rarer authorities decide through willpower, through hearing themselves speak, or through the lunar cycle.",
      },
      {
        title: 'The nine Centers',
        body: 'The Bodygraph holds nine energy centers. A defined center is consistent energy you radiate; an undefined center takes in and amplifies the energy of others: a place of potential wisdom, and of conditioning. The centers carry inspiration, conception, expression, identity, will, life force, emotion, intuition and pressure.',
      },
      {
        title: 'The experiment',
        body: "Human Design asks for no belief. The experiment is simple: follow your strategy and authority for your decisions and watch what changes. Birth time is essential for an accurate chart: without it, the Bodygraph can't be drawn.",
      },
    ],
    flavor: FLAVORS.humanDesign,
  },

  gematria: {
    key: 'gematria',
    name: 'Kabbalah',
    title: 'Gematria: Hebrew Letter Numerology',
    lineage: 'In Kabbalah the letters themselves create: to send a word is to send a world.',
    intro: [
      'Gematria assigns numerical values to Hebrew letters, words and phrases (one of the primary interpretive tools of Kabbalah). When two words share a numerical value, tradition holds they share a hidden relationship.',
      'The Sefer Yetzirah teaches that the universe was formed through combinations of the 22 letters, each carrying a number, a symbolic meaning and a sound. Your Hebrew name becomes a numerical signature connected to those patterns.',
    ],
    sections: [
      {
        title: 'The 22 letters',
        body: 'From Aleph (1, the silent divine breath) through Yod (10, the point of creation) to Tav (400, the seal of completion), each letter is held as a vehicle of creation, not a mere symbol. Five letters take extended final-form values, 500 through 900.',
      },
      {
        title: 'Calculation methods',
        body: 'Gematria is a family of methods: Mispar Hechrachi sums the standard values (Shalom = 300+30+6+40 = 376); Mispar Gadol counts final forms at their extended values; Mispar Katan reduces letters to single digits; ordinal counting values letters by position; AtBash swaps the alphabet end for end. Each lens reveals different connections.',
      },
      {
        title: 'Significant numbers',
        body: 'Certain values carry deep traditional weight: 13 joins echad (one) and ahavah (love); 18 is chai, life (the most auspicious number); 26 is the Tetragrammaton; 32 is lev, heart, the paths of wisdom; 86 joins Elohim with ha-teva, nature.',
      },
      {
        title: 'Working with your name',
        body: 'Calculate your Hebrew name with the standard method, find its digital root, and look for words sharing its value. David (Dalet, Vav, Dalet) equals 14, the value of yad (hand) and ahav (loved); its digital root, 5, is the letter He, divine breath.',
      },
      {
        title: 'The mystical frame',
        body: 'In the fourfold reading of Jewish exegesis (PaRDeS), gematria lives in Sod: the secret level. The letters combine with the ten sefirot of the Tree of Life, from Keter (crown) to Malkhut (kingdom), into the 32 paths of wisdom.',
      },
    ],
    flavor: FLAVORS.gematria,
  },

  integration: {
    key: 'integration',
    name: 'Integration',
    title: 'Integrating the Systems',
    lineage: 'Five traditions, one person: where the readings agree, pay attention.',
    intro: [
      'Dreamspell, the traditional Tzolkin, Astrology, Human Design and Gematria each offer a distinct lens on identity and purpose. They are not competing truths but complementary perspectives: different instruments in one orchestra.',
      'Pleiad reads a person through all of them at once: resonance where the systems align, complexity where they diverge.',
    ],
    sections: [
      {
        title: 'Points of correspondence',
        body: 'The same themes surface across systems. Solar identity: your Sun sign, the Yellow Sun seal, the Personality Sun gate. The emotional/lunar nature: Moon sign, Red Moon seal, the Solar Plexus center, Mem, the water letter. Communication: Mercury, White Wind, the Throat center, Pe, the mouth. Transformation: Pluto, Blue Storm, Nun, death and rebirth.',
      },
      {
        title: 'Using multiple systems',
        body: 'Learn one system well before adding others. Where systems agree, a theme is strongly emphasized; where they diverge, your nature is complex, not contradictory. Use Astrology for psychological depth and timing, Human Design for strategy and decisions, Dreamspell for daily synchronization, Gematria for the essence of your name.',
      },
      {
        title: 'Let them speak',
        body: 'The systems inform each other best when nothing is forced into agreement. A reading is a conversation between five voices: the disagreements are as instructive as the harmonies.',
      },
    ],
    flavor: FLAVORS.integration,
  },
} as const

/** Match a knowledge-search sourceUrl to a bundled doc, if it points at one. */
export function docKeyFromSourceUrl(sourceUrl: string): LibrarySystemKey | null {
  const match = /\/learn\/([a-z-]+)/.exec(sourceUrl)
  if (match === null) return null
  const segment = match[1]
  return segment !== undefined && segment in LIBRARY_DOCS
    ? (segment as LibrarySystemKey)
    : null
}
