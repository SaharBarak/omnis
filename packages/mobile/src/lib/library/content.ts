/**
 * Bundled library content — S14/F10. A trimmed mobile copy of the six
 * knowledge docs so the codex reads fully offline.
 *
 * CANONICAL SOURCE: src/lib/docs/content.ts (web) for the six system docs;
 * src/app/app/calendars/<key>/page.tsx (web) for the calendar docs. This file
 * condenses that text faithfully — no invented claims. When the web codex
 * changes, update this copy by hand. Lineage lines come from
 * src/lib/design/system-flavors.ts.
 */

import { FLAVORS, type SystemFlavor } from '@/theme/tokens'

/**
 * Route segment for /learn/[system] — system docs match the web /learn/*
 * slugs; calendar docs (#69) match the web /app/calendars/* pages via
 * `webPath`.
 */
export type LibrarySystemKey =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'human-design'
  | 'gematria'
  | 'integration'
  | 'hebrew'
  | 'hijri'
  | 'persian'
  | 'chinese'
  | 'panchang'
  | 'long-count'

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
  /** Web path for the "full codex" handoff when not /learn/<key>. */
  webPath?: string
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
  hebrew: {
    key: 'hebrew',
    name: 'Hebrew Calendar',
    title: 'A lunisolar count in its 58th century',
    lineage: 'Months follow the moon, years follow the sun — festivals held to their seasons.',
    intro: [
      'The Hebrew calendar is lunisolar: months begin near the new moon, and a thirteenth month is added in leap years so the festivals stay tied to their seasons — Passover in spring, Sukkot in autumn.',
      'Days run from sunset to sunset, and years are counted from the traditional date of creation. The civil year 2026 spans the Hebrew years 5786 and 5787.',
    ],
    sections: [
      {
        title: 'From observation to calculation',
        body: 'In the biblical period, months were declared when witnesses saw the new crescent. As the diaspora spread, observation became untenable; in the fourth century CE — tradition credits Hillel II — the calendar was fixed by calculation, and those rules are still in use today.',
      },
      {
        title: 'The Metonic cycle',
        body: 'Leap years follow the 19-year Metonic cycle: years 3, 6, 8, 11, 14, 17, and 19 add a second Adar — seven leap years in nineteen. Nineteen solar years and 235 lunar months differ by only about two hours, which keeps Passover in spring indefinitely.',
      },
      {
        title: 'The molad and the postponements',
        body: 'The fixed calendar computes the molad — the mean lunar conjunction — for Tishri of each year, then applies four postponement rules that place Rosh Hashanah so the festivals fall on workable weekdays. The slack is absorbed by Heshvan and Kislev, each of which can take 29 or 30 days.',
      },
      {
        title: 'In modern life',
        body: 'The Hebrew calendar is an official calendar of the State of Israel, and worldwide it governs the Jewish ritual year — festivals, Torah readings, bar and bat mitzvah dates, yahrzeits — even in communities that live civil life on the Gregorian calendar.',
      },
    ],
    flavor: { name: 'Hebrew Calendar', accent: '#D4AF37', accentSoft: '#EFD98B' },
    webPath: '/app/calendars/hebrew',
  },
  hijri: {
    key: 'hijri',
    name: 'Hijri Calendar',
    title: 'A purely lunar year that walks through the seasons',
    lineage: 'Twelve lunar months, no solar correction — Ramadan visits every season in a lifetime.',
    intro: [
      'The Hijri (Islamic) calendar is purely lunar: twelve lunar months and no leap month, so its year runs about 354 days — eleven days short of the solar year. Every Hijri date drifts earlier through the seasons, circling the full cycle once every 33 years or so.',
      'Days begin at sunset, and years are counted from the Hijra — the migration from Mecca to Medina in 622 CE — marked AH, Anno Hegirae.',
    ],
    sections: [
      {
        title: 'The abolition of the leap month',
        body: 'Pre-Islamic Arabia used a lunisolar scheme with an intercalated month. The Quran abolished intercalation, fixing the year at twelve lunar months, and the calendar has run purely lunar since. The era was instituted under the caliph Umar around 638 CE.',
      },
      {
        title: 'Crescent and calculation',
        body: 'For most of history months began with the sighting of the new crescent, and religious practice still honors observation: Ramadan and the Eids are proclaimed by moon-sighting committees in many countries, so observed dates can differ by a day from any computed calendar.',
      },
      {
        title: 'How the months run',
        body: 'Months alternate between 30 and 29 days, tracking the mean lunar month of about 29.53 days. Eleven times in each 30-year cycle a leap day is added to the final month, keeping the calendar aligned with the moon to within a day over centuries.',
      },
      {
        title: 'In modern life',
        body: 'Pleiad uses the Umm al-Qura reckoning — the calculated calendar of Saudi Arabia. Globally the Hijri calendar governs the Islamic ritual year — Ramadan, the two Eids, the Hajj — for nearly two billion people.',
      },
    ],
    flavor: { name: 'Hijri Calendar', accent: '#86C89B', accentSoft: '#B6DFC4' },
    webPath: '/app/calendars/hijri',
  },
  persian: {
    key: 'persian',
    name: 'Persian Calendar',
    title: 'The most accurate solar calendar in civil use',
    lineage: 'The year begins at the moment of the spring equinox, observed at Tehran.',
    intro: [
      'The Persian (Solar Hijri) calendar is purely solar, and its new year is an astronomical event: the year begins at Nowruz, the March equinox as observed on the meridian of Tehran. Seasons and months are locked together permanently.',
      'Years are counted from the Hijra like the Islamic calendar — but in solar years, so the two counts drift apart by about one year every 33.',
    ],
    sections: [
      {
        title: 'Khayyam’s reform',
        body: 'Iran has kept solar calendars for over 2,500 years, with month names honoring Zoroastrian divinities. The great reform came in 1079 CE, when a commission including Omar Khayyam fixed the year to the true equinox — more accurate than the Gregorian reform that followed five centuries later.',
      },
      {
        title: 'The equinox is the rule',
        body: 'The year begins on the day whose noon-to-noon window at Tehran contains the March equinox. Leap years fall out of the astronomy itself — usually every four years, occasionally after five. The equinox-anchored year cannot drift from the sun.',
      },
      {
        title: 'The shape of the year',
        body: 'The first six months have 31 days, the next five have 30, and the last has 29 — or 30 in a leap year. Farvardin always opens spring; Azar always closes autumn.',
      },
      {
        title: 'In modern life',
        body: 'The Solar Hijri calendar is the official calendar of Iran. Nowruz itself is bigger than any border: some 300 million people from the Balkans to Central Asia keep the equinox new year.',
      },
    ],
    flavor: { name: 'Persian Calendar', accent: '#D98E5F', accentSoft: '#EDC2A4' },
    webPath: '/app/calendars/persian',
  },
  chinese: {
    key: 'chinese',
    name: 'Chinese Calendar',
    title: 'Every year an element, an animal, a polarity',
    lineage: 'Sixty year-names — ten heavenly stems crossed with twelve earthly branches.',
    intro: [
      'The Chinese calendar is lunisolar: months follow the moon, years follow the sun, and a leap month reconciles them. Its months are numbered, but its years carry names, cycling through sixty combinations of ten heavenly stems and twelve earthly branches.',
      'The stems carry the five elements in yin and yang pairs; the branches carry the twelve animals. 2026 is bing-wu — the year of the Yang Fire Horse.',
    ],
    sections: [
      {
        title: 'The oldest count',
        body: 'Oracle bones from the Shang dynasty, three thousand years ago, already record the sexagenary day count. Calendar-making was an act of state: each dynasty issued its own calendar as proof of the Mandate of Heaven.',
      },
      {
        title: 'Leap months by solar terms',
        body: 'A month begins at the astronomical new moon. Twelve lunar months fall eleven days short of the sun, so seven times in nineteen years a leap month is inserted — placed wherever a lunar month contains no major solar term, repeating the month before it.',
      },
      {
        title: 'New year and the zodiac',
        body: 'New year falls on the second or third new moon after the winter solstice — between 21 January and 20 February — and opens a fifteen-day festival ending with lanterns at the first full moon. Note that BaZi astrology uses the solar year, which begins at the Start of Spring term instead.',
      },
      {
        title: 'In modern life',
        body: 'China lives civil life on the Gregorian calendar, but the traditional calendar sets the great festivals — New Year, Qingming, Dragon Boat, Mid-Autumn. Across the diaspora the zodiac year remains personal identity.',
      },
    ],
    flavor: { name: 'Chinese Calendar', accent: '#CF6F6F', accentSoft: '#E5A9A9' },
    webPath: '/app/calendars/chinese',
  },
  panchang: {
    key: 'panchang',
    name: 'Panchang',
    title: 'The Hindu almanac of five limbs',
    lineage: 'A calendar that measures qualities of time, not just quantities.',
    intro: [
      'A panchang ("five limbs") is the daily almanac of Hindu timekeeping. Where other calendars answer "what day is it," the panchang answers "what kind of day is it" — through five simultaneous cycles: tithi, nakshatra, yoga, karana, and vara.',
      'The tithi is the headline: thirty lunar days per month, fifteen waxing and fifteen waning. Nearly every Hindu festival is a tithi — Diwali is a new-moon tithi, Holi a full-moon one.',
    ],
    sections: [
      {
        title: 'The five limbs',
        body: 'Tithi: the time the moon needs to gain 12° on the sun. Nakshatra: the moon’s mansion among 27 star-stations. Yoga: 27 divisions of the sun-moon longitude sum. Karana: half a tithi. Vara: the weekday, ruled by its planet.',
      },
      {
        title: 'From the Vedas to the siddhantas',
        body: 'The roots are in the Vedanga Jyotisha, from the middle of the first millennium BCE. The classical siddhantas — above all the Surya Siddhanta — put the almanac on mathematical footing, and regional traditions diverged into the many pancangas of India.',
      },
      {
        title: 'Sidereal reckoning',
        body: 'Nakshatras live in the sidereal sky: positions subtract the ayanamsa — the accumulated precession offset, about 24° today — from tropical longitudes. Pleiad uses the Lahiri ayanamsa, the Indian government standard, computed at noon UTC.',
      },
      {
        title: 'In modern life',
        body: 'Panchang apps and printed almanacs are consulted daily across India and the diaspora — for festival dates, fasting days like Ekadashi, and muhurta timings for weddings and new ventures.',
      },
    ],
    flavor: { name: 'Panchang', accent: '#C9A227', accentSoft: '#E7D08A' },
    webPath: '/app/calendars/panchang',
  },
  'long-count': {
    key: 'long-count',
    name: 'Long Count',
    title: 'A day count from a mythological zero',
    lineage: 'The calendar that carved history in stone, one day-number at a time.',
    intro: [
      'The Maya Long Count is not a cycle but a tally: an absolute count of days from a creation date in 3114 BCE, written as five nested place values — baktun, katun, tun, winal, kin.',
      'Where the Tzolkin and Haab wheel around every 260 and 365 days, the Long Count never repeats on a human timescale — the Maya used it to fix historical events uniquely in time.',
    ],
    sections: [
      {
        title: 'The places',
        body: 'The system is almost pure base-20: 20 kin make a winal, 18 winals a tun (360 days), 20 tuns a katun (about 19.7 years), 20 katuns a baktun (about 394 years). The 18 keeps the tun near the solar year.',
      },
      {
        title: 'Written in stone',
        body: 'Classic-period stelae open with the Initial Series — a Long Count date followed by the day’s Tzolkin and Haab positions — anchoring coronations, wars, and dedications to the exact day.',
      },
      {
        title: '2012 and the thirteenth baktun',
        body: 'The famous 13.0.0.0.0 of 21 December 2012 was the completion of the thirteenth baktun — a great odometer rollover, celebrated in antiquity as period endings always were, with monuments rather than apocalypses.',
      },
      {
        title: 'The correlation',
        body: 'Conversion is pure arithmetic on the Julian Day Number: creation corresponds to JDN 584283 — the GMT correlation, standard since Thompson. Every conversion in Pleiad is day-precise across the whole historical range.',
      },
    ],
    flavor: { name: 'Long Count', accent: '#2E6E5E', accentSoft: '#7FB5A6' },
    webPath: '/app/calendars/long-count',
  },
} as const

/** The calendar-atlas docs, in the Today board's row order. */
export const CALENDAR_ORDER: readonly LibrarySystemKey[] = [
  'hebrew',
  'hijri',
  'persian',
  'chinese',
  'panchang',
  'long-count',
] as const

/** Match a knowledge-search sourceUrl to a bundled doc, if it points at one. */
export function docKeyFromSourceUrl(sourceUrl: string): LibrarySystemKey | null {
  const match = /\/learn\/([a-z-]+)/.exec(sourceUrl)
  if (match === null) return null
  const segment = match[1]
  return segment !== undefined && segment in LIBRARY_DOCS
    ? (segment as LibrarySystemKey)
    : null
}
