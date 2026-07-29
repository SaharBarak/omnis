/**
 * Learning Library (#79) — the PRD's Q&A-shaped educational articles.
 * Content is data (same pattern as src/lib/docs/content.ts), not MDX: the
 * article shape is one hop from MDX frontmatter + body, so a later MDX
 * migration is mechanical, and this avoids touching the build pipeline.
 *
 * Every article answers one real question. Facts follow the same accuracy
 * bar as the engine docs; where systems disagree, the article says so.
 */

export interface ArticleSection {
  readonly heading?: string
  readonly paragraphs: readonly string[]
}

export interface Article {
  readonly slug: string
  readonly title: string
  /** The question the article answers — the library's organizing unit. */
  readonly question: string
  readonly topic:
    | 'astrology'
    | 'dreamspell'
    | 'calendars'
    | 'human-design'
    | 'kabbalah'
    | 'numerology'
    | 'chinese'
    | 'oracles'
    | 'psychology'
  readonly minutes: number
  readonly sections: readonly ArticleSection[]
  readonly related: readonly { label: string; href: string }[]
}

export const TOPIC_LABELS: Readonly<Record<Article['topic'], string>> = {
  astrology: 'Astrology',
  dreamspell: 'Dreamspell',
  calendars: 'Calendars',
  'human-design': 'Human Design',
  kabbalah: 'Kabbalah',
  numerology: 'Numerology',
  chinese: 'Chinese metaphysics',
  oracles: 'Oracles',
  psychology: 'Psychology',
}

export const ARTICLES: readonly Article[] = [
  {
    slug: 'tropical-vs-sidereal',
    title: 'Tropical vs. sidereal',
    question: 'Why do Western and Vedic astrology give me different signs?',
    topic: 'astrology',
    minutes: 4,
    sections: [
      {
        paragraphs: [
          'Both zodiacs divide the sky into the same twelve signs — the difference is where they pin the starting line. The tropical zodiac, used by Western astrology, anchors 0° Aries to the March equinox: the moment the sun crosses the celestial equator heading north. The sidereal zodiac, used by Vedic astrology (jyotisha), anchors the signs to the fixed stars themselves.',
          'These two starting lines coincided around the 3rd century CE. Since then the equinox has been sliding slowly backward against the stars — the precession of the equinoxes, a 25,800-year wobble of Earth’s axis — and the two zodiacs have drifted apart by about 24 degrees. That offset is called the ayanamsa.',
        ],
      },
      {
        heading: 'What it means in practice',
        paragraphs: [
          'If you were born with the sun at 10° Aries tropically, your sidereal sun sits around 16° Pisces. Neither system is "wrong": the tropical zodiac measures the sun’s relationship to Earth’s seasons, the sidereal zodiac its position against the stellar backdrop. They are answering different questions.',
          'Pleiad shows both: the Sun row on the Today board is tropical; the Sidereal row applies the Lahiri ayanamsa — the Indian government standard — to the same ephemeris.',
        ],
      },
    ],
    related: [
      { label: 'Learn astrology', href: '/learn/astrology' },
      { label: 'Panchang', href: '/app/calendars/panchang' },
    ],
  },
  {
    slug: 'why-leap-months',
    title: 'Why leap months exist',
    question: 'Why do some calendars add a whole extra month?',
    topic: 'calendars',
    minutes: 4,
    sections: [
      {
        paragraphs: [
          'The sun and the moon refuse to divide evenly. Twelve lunar months add up to about 354 days — eleven short of the solar year. A calendar that follows only the moon (like the Islamic calendar) lets its dates drift through the seasons, a full circuit every 33 years. A calendar that wants both — months that track the moon AND festivals that stay in season — has to make up the shortfall somewhere.',
          'The lunisolar solution is the leap month: roughly every three years, the year gets thirteen months instead of twelve. The Hebrew calendar doubles Adar; the Chinese calendar repeats whichever month contains no major solar term.',
        ],
      },
      {
        heading: 'The Metonic cycle',
        paragraphs: [
          'The arithmetic underneath is beautiful: 19 solar years and 235 lunar months differ by only about two hours. So a 19-year cycle with seven leap months keeps sun and moon reconciled essentially forever — the Metonic cycle, discovered independently in Babylon, Greece, and China.',
          'The Hebrew calendar fixes its leap years at positions 3, 6, 8, 11, 14, 17, and 19 of the cycle; the Chinese calendar derives them from the astronomy directly. Both land in the same place: Passover stays in spring, and the Chinese New Year stays between 21 January and 20 February.',
        ],
      },
    ],
    related: [
      { label: 'Hebrew Calendar', href: '/app/calendars/hebrew' },
      { label: 'Chinese Calendar', href: '/app/calendars/chinese' },
    ],
  },
  {
    slug: 'personal-year-calculation',
    title: 'The numerology Personal Year',
    question: 'How is my Personal Year calculated — and why does it change in January?',
    topic: 'numerology',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'The Personal Year is the numerology of a year of your life: add your birth month, your birth day, and the current calendar year, then reduce the total to a single digit (or a master number). Born 29 July, in 2026: 7 + (2+9→11) + (2+0+2+6→1) = 19 → 1. A Personal Year 1 — the start of a nine-year cycle.',
          'By the common modern convention the number turns over on 1 January with the universal year, not on your birthday — which is why it changes in January. Some older schools count birthday-to-birthday instead; Pleiad uses the calendar-year convention and says so.',
        ],
      },
      {
        heading: 'Month and day',
        paragraphs: [
          'The chain continues downward: Personal Month = Personal Year + calendar month, reduced; Personal Day = Personal Month + calendar day, reduced. Nine-year, nine-month, and nine-day cycles nested like gears.',
          'Note this is a different concept from the Dreamspell personal year, which runs birthday to birthday on the 260-day kin count — the same words for two unrelated wheels.',
        ],
      },
    ],
    related: [
      { label: 'Numerology', href: '/app/numerology' },
    ],
  },
  {
    slug: 'history-of-dreamspell',
    title: 'The history of the Dreamspell',
    question: 'Where does the Dreamspell come from — is it the Mayan calendar?',
    topic: 'dreamspell',
    minutes: 5,
    sections: [
      {
        paragraphs: [
          'The Dreamspell is a modern system, created in 1987-1991 by José Argüelles and Lloydine Argüelles. It reinterprets the ancient Maya Tzolkin — the 260-day sacred count — through a contemporary spiritual lens, adding the 13-Moon year, the Day Out of Time, and the five-part oracle of guide, analog, antipode, and occult partners.',
          'It is not the calendar the Maya kept, and honest presentation keeps the two distinct. The traditional Tzolkin runs unbroken — it does not skip leap days — while the Dreamspell freezes its count on 29 February to stay synchronized with the civil year. The two counts therefore drift apart by one day every leap year.',
        ],
      },
      {
        heading: 'The lineage',
        paragraphs: [
          'Argüelles anchored the Dreamspell to 26 July 1987 — the "Galactic Synchronization" that followed the Harmonic Convergence he had convened that August, the first globally coordinated meditation event. The 13-Moon calendar movement that grew from it proposed calendar reform: thirteen months of 28 days as a saner civil rhythm.',
          'Pleiad computes both: the Dreamspell kin (with its leap-day freeze) on the Today board and calendar, and the unbroken traditional Tzolkin on person pages — two readings, honestly labeled.',
        ],
      },
    ],
    related: [
      { label: 'Learn the Dreamspell', href: '/learn/dreamspell' },
      { label: 'Learn the Tzolkin', href: '/learn/tzolkin' },
      { label: 'Dreamspell Calendar', href: '/app/calendar' },
    ],
  },
  {
    slug: 'what-is-hebrew-calendar',
    title: 'The Hebrew calendar',
    question: 'What is the Hebrew calendar and why is it in year 5786?',
    topic: 'calendars',
    minutes: 4,
    sections: [
      {
        paragraphs: [
          'The Hebrew calendar is lunisolar: months begin near the new moon, years follow the sun via seven leap months in every nineteen years. Days run sunset to sunset — a Hebrew date begins the evening before its civil counterpart.',
          'The year count is Anno Mundi, "year of the world" — counted from the traditional date of creation as computed from the biblical genealogies. The civil year 2026 spans the Hebrew years 5786 and 5787, turning over at Rosh Hashanah in September.',
        ],
      },
      {
        heading: 'From witnesses to arithmetic',
        paragraphs: [
          'For centuries the month began when witnesses saw the new crescent and the court in Jerusalem proclaimed it. In the fourth century CE the calendar was fixed by calculation — tradition credits Hillel II — and those rules, refined through the geonic period, still govern it: the molad (mean conjunction) is computed in 1080ths of an hour, and four postponement rules place Rosh Hashanah on a workable weekday.',
        ],
      },
    ],
    related: [
      { label: 'Hebrew Calendar page', href: '/app/calendars/hebrew' },
      { label: 'Why leap months?', href: '/app/library/why-leap-months' },
    ],
  },
  {
    slug: 'what-is-human-design',
    title: 'What Human Design is',
    question: 'What is Human Design and what is a bodygraph?',
    topic: 'human-design',
    minutes: 4,
    sections: [
      {
        paragraphs: [
          'Human Design is a modern synthesis created by Ra Uru Hu (Alan Krakower) in 1987, combining the I Ching’s 64 hexagrams, the Kabbalistic tree, the chakra system, and astrology into one map: the bodygraph — nine centers connected by 36 channels, activated by where the planets stood at your birth and roughly 88 days before it (the "design" calculation).',
          'The 64 gates of the bodygraph map one-to-one onto the 64 hexagrams; which gates are activated, and which centers they define, produce your type (Generator, Projector, Manifestor, Reflector), your strategy, and your authority — the system’s core practical guidance.',
        ],
      },
      {
        heading: 'What Pleiad computes',
        paragraphs: [
          'Pleiad computes the full bodygraph from birth date, time, and place — the same activations also drive the Gene Keys profile, which reads the identical gates as a contemplative path rather than a mechanical one. A birth time matters: without it the design side cannot be fixed, and the chart is honestly partial.',
        ],
      },
    ],
    related: [
      { label: 'Learn Human Design', href: '/learn/human-design' },
      { label: 'Gene Keys', href: '/app/gene-keys' },
    ],
  },
  {
    slug: 'bazi-day-master',
    title: 'The BaZi Day Master',
    question: 'What is a Day Master in Chinese astrology?',
    topic: 'chinese',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'BaZi — "eight characters" — reads a birth moment as four pillars: year, month, day, and hour, each a pair of one heavenly stem and one earthly branch. The Day Master is the heavenly stem of the day pillar, and it is the chart’s center: the self that everything else is read against.',
          'A Day Master is one of ten: the five elements each in yang and yin — Yang Wood like a tree, Yin Wood like a vine; Yang Fire like the sun, Yin Fire like a candle; and so on. The rest of the chart is interpreted as how the other elements support, drain, or challenge that core element.',
        ],
      },
      {
        heading: 'Where the day pillar comes from',
        paragraphs: [
          'Unlike the year and month, the day pillar ignores sun and moon entirely: it is a pure count — the sexagenary cycle of 60 stem-branch pairs rolling unbroken across days for over two millennia. Pleiad computes it arithmetically from the Julian Day Number, which makes it exact for any date.',
        ],
      },
    ],
    related: [
      { label: 'BaZi — Four Pillars', href: '/app/bazi' },
      { label: 'Chinese Calendar', href: '/app/calendars/chinese' },
    ],
  },
  {
    slug: 'gematria-basics',
    title: 'How gematria works',
    question: 'How can a Hebrew name be a number?',
    topic: 'kabbalah',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'Hebrew has no separate numerals: every letter is also a number. Aleph is 1, Bet is 2, Yod is 10, Kuf is 100 — so every word is also a sum. Gematria is the practice of reading those sums: words that share a value are held to share a hidden kinship.',
          'The classic example: chai (חי), "life", sums to 18 — which is why gifts and donations in Jewish custom come in multiples of eighteen.',
        ],
      },
      {
        heading: 'More than one way to count',
        paragraphs: [
          'The standard value is only the first method. Ordinal counting numbers letters by position; atbash swaps the alphabet end for end; the "small" value reduces to digits. Pleiad computes seven methods for every Hebrew name, because the traditions themselves never settled on one.',
        ],
      },
    ],
    related: [
      { label: 'Learn Gematria', href: '/learn/gematria' },
      { label: 'Tree of Life', href: '/app/tree-of-life' },
    ],
  },
  {
    slug: 'what-long-count-counts',
    title: 'What the Long Count counts',
    question: 'What actually happened on 21 December 2012?',
    topic: 'calendars',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'The Maya Long Count is a running tally of days from a mythological creation date in 3114 BCE, written in five nested places: baktun, katun, tun, winal, kin. On 21 December 2012 the count reached 13.0.0.0.0 — the completion of the thirteenth baktun, roughly 5,125 years into the count.',
          'In the inscriptions this is an odometer moment, not an ending: Maya texts calmly project dates far beyond it, including one at Palenque more than 4,000 years in the future. Period endings were celebrated with monuments, the way a civilization marks a millennium.',
        ],
      },
      {
        heading: 'Reading a Long Count date',
        paragraphs: [
          'The places are nearly pure base-20 — except the tun, which is 18 winals (360 days) to stay close to the solar year. Every Long Count day also carries its position in the 260-day Tzolkin and 365-day Haab; the three systems together fix any date uniquely for thousands of years.',
        ],
      },
    ],
    related: [
      { label: 'Maya Long Count', href: '/app/calendars/long-count' },
      { label: 'Learn the Tzolkin', href: '/learn/tzolkin' },
    ],
  },
  {
    slug: 'what-is-panchang',
    title: 'Reading a panchang',
    question: 'What are the five limbs of the Hindu almanac?',
    topic: 'calendars',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'A panchang ("five limbs") tells you not just what day it is but what kind of day: tithi, the lunar day measured in 12° steps of moon-sun separation; nakshatra, the moon’s mansion among 27 star-stations; yoga, computed from the sum of solar and lunar longitudes; karana, half a tithi; and vara, the planetary weekday.',
          'Nearly every Hindu festival is pinned to a tithi — Diwali to the new moon of Kartika, Holi to the full moon of Phalguna — which is why their civil dates move each year while their lunar logic never does.',
        ],
      },
      {
        heading: 'Why almanacs disagree by a day',
        paragraphs: [
          'Traditional pancangas anchor the day at local sunrise; Pleiad computes at noon UTC. A tithi that changes mid-morning lands on different civil days under the two conventions — sign-level agreement, not minute-level, and the page says so.',
        ],
      },
    ],
    related: [
      { label: 'Panchang page', href: '/app/calendars/panchang' },
      { label: 'Tropical vs. sidereal', href: '/app/library/tropical-vs-sidereal' },
    ],
  },
  {
    slug: 'iching-hexagrams',
    title: 'How I Ching hexagrams work',
    question: 'What is a hexagram, and why 64?',
    topic: 'oracles',
    minutes: 3,
    sections: [
      {
        paragraphs: [
          'A hexagram is six stacked lines, each either solid (yang) or broken (yin). Six binary lines give 2⁶ = 64 possible figures — the complete alphabet of change in the I Ching, China’s oldest classic. Each hexagram is read as two trigrams of three lines: eight elemental images (Heaven, Earth, Thunder, Water, Mountain, Wind, Fire, Lake) paired into a situation.',
          'The Zhou-era text attaches a Judgment to each figure; three thousand years of commentary — Confucian, Daoist, Buddhist — grew around them. Traditional consultation cast yarrow stalks or coins to build a hexagram line by line; the changing lines pointed to a second hexagram, the situation’s direction of travel.',
        ],
      },
      {
        heading: 'Everywhere at once',
        paragraphs: [
          'The same 64 figures drive Human Design’s gates and the Gene Keys — hexagram n, gate n, and Gene Key n are the same figure wearing three vocabularies. Pleiad draws a daily hexagram deterministically from the date and your account, so a day’s reading is stable everywhere you open it.',
        ],
      },
    ],
    related: [
      { label: 'Oracles', href: '/app/oracles' },
      { label: 'Gene Keys', href: '/app/gene-keys' },
    ],
  },
  {
    slug: 'attachment-styles-primer',
    title: 'Attachment styles, briefly',
    question: 'What do secure, anxious, and avoidant actually mean?',
    topic: 'psychology',
    minutes: 4,
    sections: [
      {
        paragraphs: [
          'Attachment theory, developed by John Bowlby and Mary Ainsworth from the 1950s onward, describes the strategies people learn for staying connected to caregivers — strategies that tend to persist into adult relationships. Secure attachment treats closeness and autonomy as compatible; anxious attachment seeks closeness and fears distance; avoidant attachment protects autonomy and rations closeness; fearful-avoidant carries both signals at once.',
          'These are patterns, not diagnoses or destinies — the research consistently shows styles can shift toward security in stable relationships. The classic friction is the anxious-avoidant loop: one partner pursues connection, which triggers the other’s withdrawal, which triggers more pursuit. Naming the cycle is most of the work of breaking it.',
        ],
      },
      {
        heading: 'In Pleiad',
        paragraphs: [
          'Attachment style is one of the self-reported personality frameworks on a person’s profile — nothing computes it from a birth date, and Pleiad doesn’t pretend to. When two people on your map both carry a style, the couple map reads the pairing.',
        ],
      },
    ],
    related: [
      { label: 'People', href: '/app/people' },
    ],
  },
]

export const ARTICLE_BY_SLUG: Readonly<Record<string, Article>> = Object.freeze(
  Object.fromEntries(ARTICLES.map((a) => [a.slug, a]))
)
