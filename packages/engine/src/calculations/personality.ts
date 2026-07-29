/**
 * Personality frameworks (#75) — MBTI (with cognitive functions),
 * Enneagram, Big Five, DISC, attachment styles, love languages, and VIA
 * strengths. These are USER-ENTERED profiles, not computed: unlike the
 * calendar systems there is nothing to derive them from, so the engine's
 * job is the reference data, validation, and honest pairwise comparison.
 */

// ---------------------------------------------------------------------------
// MBTI
// ---------------------------------------------------------------------------

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const

export type MbtiType = (typeof MBTI_TYPES)[number]

const MBTI_NICKNAMES: Readonly<Record<MbtiType, string>> = Object.freeze({
  INTJ: 'The Architect', INTP: 'The Logician', ENTJ: 'The Commander', ENTP: 'The Debater',
  INFJ: 'The Advocate', INFP: 'The Mediator', ENFJ: 'The Protagonist', ENFP: 'The Campaigner',
  ISTJ: 'The Inspector', ISFJ: 'The Defender', ESTJ: 'The Executive', ESFJ: 'The Consul',
  ISTP: 'The Virtuoso', ISFP: 'The Adventurer', ESTP: 'The Entrepreneur', ESFP: 'The Entertainer',
})

type CognitiveFunction = 'Ni' | 'Ne' | 'Si' | 'Se' | 'Ti' | 'Te' | 'Fi' | 'Fe'

/** The four-function stack (dominant → inferior) by Grant/Beebe convention. */
export function cognitiveFunctions(type: MbtiType): CognitiveFunction[] {
  const [attitude, perceiving, judging, lifestyle] = type.split('') as [
    'I' | 'E', 'N' | 'S', 'T' | 'F', 'J' | 'P',
  ]
  // The extraverted function among the top two is the one the J/P letter points at.
  const perceivingFn = (perceiving === 'N' ? 'N' : 'S') as 'N' | 'S'
  const judgingFn = (judging === 'T' ? 'T' : 'F') as 'T' | 'F'
  const extravertedIsJudging = lifestyle === 'J'
  const dominantIsJudging = attitude === 'E' ? extravertedIsJudging : !extravertedIsJudging

  const dom = dominantIsJudging
    ? `${judgingFn}${attitude === 'E' ? 'e' : 'i'}`
    : `${perceivingFn}${attitude === 'E' ? 'e' : 'i'}`
  const auxAttitude = attitude === 'E' ? 'i' : 'e'
  const aux = dominantIsJudging
    ? `${perceivingFn}${auxAttitude}`
    : `${judgingFn}${auxAttitude}`

  const flip = (fn: string): string => {
    const letter = fn[0] as 'N' | 'S' | 'T' | 'F'
    const opposite: Record<string, string> = { N: 'S', S: 'N', T: 'F', F: 'T' }
    const att = fn[1] === 'e' ? 'i' : 'e'
    return `${opposite[letter]}${att}`
  }

  return [dom, aux, flip(aux), flip(dom)] as CognitiveFunction[]
}

export function mbtiNickname(type: MbtiType): string {
  return MBTI_NICKNAMES[type]
}

// ---------------------------------------------------------------------------
// Enneagram
// ---------------------------------------------------------------------------

export interface EnneagramType {
  readonly number: number
  readonly name: string
  readonly drive: string
}

export const ENNEAGRAM_TYPES: readonly EnneagramType[] = Object.freeze([
  { number: 1, name: 'The Reformer', drive: 'To be good and right; the inner critic as compass' },
  { number: 2, name: 'The Helper', drive: 'To be needed and loved; giving as identity' },
  { number: 3, name: 'The Achiever', drive: 'To be valuable through success; image as fuel' },
  { number: 4, name: 'The Individualist', drive: 'To be uniquely oneself; longing as depth' },
  { number: 5, name: 'The Investigator', drive: 'To be capable through knowing; withdrawal as safety' },
  { number: 6, name: 'The Loyalist', drive: 'To be secure and supported; vigilance as care' },
  { number: 7, name: 'The Enthusiast', drive: 'To be satisfied and free; options as escape' },
  { number: 8, name: 'The Challenger', drive: 'To be strong and in control; intensity as protection' },
  { number: 9, name: 'The Peacemaker', drive: 'To be at peace; merging as comfort' },
])

// ---------------------------------------------------------------------------
// The remaining frameworks
// ---------------------------------------------------------------------------

export const DISC_STYLES = ['D', 'I', 'S', 'C'] as const
export type DiscStyle = (typeof DISC_STYLES)[number]

export const DISC_NAMES: Readonly<Record<DiscStyle, string>> = Object.freeze({
  D: 'Dominance — direct, decisive, results-first',
  I: 'Influence — enthusiastic, social, persuasion-first',
  S: 'Steadiness — patient, loyal, stability-first',
  C: 'Conscientiousness — precise, analytical, quality-first',
})

export const ATTACHMENT_STYLES = [
  'secure', 'anxious', 'avoidant', 'fearful-avoidant',
] as const
export type AttachmentStyle = (typeof ATTACHMENT_STYLES)[number]

export const ATTACHMENT_NAMES: Readonly<Record<AttachmentStyle, string>> = Object.freeze({
  secure: 'Secure — comfortable with closeness and autonomy',
  anxious: 'Anxious — closeness sought, distance feared',
  avoidant: 'Avoidant — autonomy protected, closeness rationed',
  'fearful-avoidant': 'Fearful-avoidant — closeness both wanted and feared',
})

export const LOVE_LANGUAGES = [
  'words of affirmation', 'quality time', 'receiving gifts',
  'acts of service', 'physical touch',
] as const
export type LoveLanguage = (typeof LOVE_LANGUAGES)[number]

export const BIG_FIVE_DIMENSIONS = [
  { key: 'openness', label: 'Openness', high: 'curious, imaginative', low: 'practical, conventional' },
  { key: 'conscientiousness', label: 'Conscientiousness', high: 'organized, disciplined', low: 'spontaneous, flexible' },
  { key: 'extraversion', label: 'Extraversion', high: 'outgoing, energized by people', low: 'reserved, energized by solitude' },
  { key: 'agreeableness', label: 'Agreeableness', high: 'cooperative, trusting', low: 'skeptical, competitive' },
  { key: 'neuroticism', label: 'Neuroticism', high: 'emotionally reactive', low: 'emotionally stable' },
] as const

export type BigFiveKey = (typeof BIG_FIVE_DIMENSIONS)[number]['key']
export type BigFiveScores = Partial<Record<BigFiveKey, number>>

/** The 24 VIA character strengths under their six virtues. */
export const VIA_STRENGTHS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  Wisdom: ['Creativity', 'Curiosity', 'Judgment', 'Love of Learning', 'Perspective'],
  Courage: ['Bravery', 'Perseverance', 'Honesty', 'Zest'],
  Humanity: ['Love', 'Kindness', 'Social Intelligence'],
  Justice: ['Teamwork', 'Fairness', 'Leadership'],
  Temperance: ['Forgiveness', 'Humility', 'Prudence', 'Self-Regulation'],
  Transcendence: ['Appreciation of Beauty', 'Gratitude', 'Hope', 'Humor', 'Spirituality'],
})

// ---------------------------------------------------------------------------
// The stored profile
// ---------------------------------------------------------------------------

export interface PersonalityProfile {
  readonly mbti?: MbtiType | null
  /** e.g. "4" or "4w5". */
  readonly enneagram?: string | null
  readonly disc?: DiscStyle | null
  readonly attachment?: AttachmentStyle | null
  /** Ranked, first = primary. */
  readonly loveLanguages?: readonly LoveLanguage[] | null
  /** 0-100 per dimension. */
  readonly bigFive?: BigFiveScores | null
  /** Top strengths, ordered. */
  readonly viaStrengths?: readonly string[] | null
}

export function isValidEnneagram(value: string): boolean {
  return /^[1-9](w[1-9])?$/.test(value)
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface PersonalityComparisonLine {
  readonly framework: string
  readonly a: string
  readonly b: string
  readonly note: string
}

function mbtiLine(a: MbtiType, b: MbtiType): PersonalityComparisonLine {
  const fa = cognitiveFunctions(a)
  const fb = cognitiveFunctions(b)
  const shared = fa.filter((f) => fb.includes(f))
  const sameLetters = [...a].filter((ch, i) => b[i] === ch).length
  const note =
    a === b
      ? 'The same type — instant mutual recognition, and the same blind spots doubled.'
      : shared.length >= 2
        ? `Share ${shared.length} cognitive functions (${shared.join(', ')}) — they process the world through overlapping lenses.`
        : shared.length === 1
          ? `One shared function (${shared[0]}) — a bridge between otherwise different stacks.`
          : `No shared functions and ${sameLetters}/4 shared letters — each covers what the other doesn't see, which is either friction or a full map.`
  return { framework: 'MBTI', a: `${a} · ${mbtiNickname(a)}`, b: `${b} · ${mbtiNickname(b)}`, note }
}

function enneagramLine(a: string, b: string): PersonalityComparisonLine {
  const coreA = Number(a[0])
  const coreB = Number(b[0])
  const describe = (n: number) => ENNEAGRAM_TYPES[n - 1]
  const adjacent = Math.abs(coreA - coreB) === 1 || Math.abs(coreA - coreB) === 8
  const note =
    coreA === coreB
      ? 'The same core type — deep mutual understanding of the same underlying drive.'
      : adjacent
        ? 'Adjacent types on the circle — neighboring drives that often serve as each other’s wings.'
        : `${describe(coreA).name} meets ${describe(coreB).name} — different core drives; naming them out loud is most of the work.`
  return { framework: 'Enneagram', a: `${a} · ${describe(coreA).name}`, b: `${b} · ${describe(coreB).name}`, note }
}

function attachmentLine(a: AttachmentStyle, b: AttachmentStyle): PersonalityComparisonLine {
  const key = [a, b].sort().join('+')
  const notes: Record<string, string> = {
    'secure+secure': 'Two secure styles — conflict stays about the issue, not the bond.',
    'anxious+secure': 'A secure partner steadies an anxious system; consistency is the medicine.',
    'avoidant+secure': 'A secure partner can widen an avoidant comfort zone without chasing.',
    'anxious+avoidant': 'The classic pursue-withdraw loop — each activates the other’s alarm; naming the cycle beats winning it.',
    'anxious+anxious': 'Two anxious systems — abundant reassurance, and storms that feed each other.',
    'avoidant+avoidant': 'Two avoidant systems — peaceful distance that can quietly become just distance.',
  }
  const fallback = 'Fearful-avoidant blends both signals — go slow, make safety explicit.'
  return {
    framework: 'Attachment',
    a: ATTACHMENT_NAMES[a],
    b: ATTACHMENT_NAMES[b],
    note: notes[key] ?? fallback,
  }
}

function loveLanguagesLine(
  a: readonly LoveLanguage[],
  b: readonly LoveLanguage[]
): PersonalityComparisonLine {
  const primaryMatch = a[0] !== undefined && a[0] === b[0]
  const overlap = a.slice(0, 2).filter((l) => b.slice(0, 2).includes(l))
  const note = primaryMatch
    ? 'The same primary language — love lands the way it is sent.'
    : overlap.length > 0
      ? `Overlapping languages (${overlap.join(', ')}) — some love arrives pre-translated.`
      : 'No overlap in the top languages — each must learn to speak the other’s, deliberately.'
  return { framework: 'Love languages', a: a.join(', '), b: b.join(', '), note }
}

function discLine(a: DiscStyle, b: DiscStyle): PersonalityComparisonLine {
  const note =
    a === b
      ? 'The same style — a shared pace, and a shared blind side.'
      : (a === 'D' && b === 'S') || (a === 'S' && b === 'D') || (a === 'I' && b === 'C') || (a === 'C' && b === 'I')
        ? 'Opposite corners of the grid — each strongest exactly where the other is stretched.'
        : 'Neighboring styles — different emphases with plenty of common ground.'
  return { framework: 'DISC', a: DISC_NAMES[a], b: DISC_NAMES[b], note }
}

function bigFiveLine(a: BigFiveScores, b: BigFiveScores): PersonalityComparisonLine | null {
  const gaps = BIG_FIVE_DIMENSIONS.flatMap((d) => {
    const va = a[d.key]
    const vb = b[d.key]
    if (va === undefined || vb === undefined) return []
    return [{ label: d.label, gap: Math.abs(va - vb) }]
  })
  if (gaps.length === 0) return null
  const biggest = gaps.reduce((max, g) => (g.gap > max.gap ? g : max))
  const note =
    biggest.gap >= 40
      ? `Largest gap is ${biggest.label} (${biggest.gap} points) — expect this to be the recurring negotiation.`
      : 'No dimension differs sharply — temperaments run broadly parallel.'
  return {
    framework: 'Big Five',
    a: gaps.map((g) => g.label[0]).join(''),
    b: `${gaps.length} dimensions compared`,
    note,
  }
}

/** Every comparison both profiles can support; frameworks missing on either side are skipped. */
export function comparePersonalities(
  a: PersonalityProfile,
  b: PersonalityProfile
): PersonalityComparisonLine[] {
  const lines: PersonalityComparisonLine[] = []
  if (a.mbti && b.mbti) lines.push(mbtiLine(a.mbti, b.mbti))
  if (a.enneagram && b.enneagram && isValidEnneagram(a.enneagram) && isValidEnneagram(b.enneagram)) {
    lines.push(enneagramLine(a.enneagram, b.enneagram))
  }
  if (a.attachment && b.attachment) lines.push(attachmentLine(a.attachment, b.attachment))
  if (a.loveLanguages?.length && b.loveLanguages?.length) {
    lines.push(loveLanguagesLine(a.loveLanguages, b.loveLanguages))
  }
  if (a.disc && b.disc) lines.push(discLine(a.disc, b.disc))
  if (a.bigFive && b.bigFive) {
    const line = bigFiveLine(a.bigFive, b.bigFive)
    if (line) lines.push(line)
  }
  return lines
}
