/**
 * Preferred-systems preference — the single source of truth for "which
 * systems does this user want to see". Persisted on the profile under
 * `preferences.systems` (rides the existing profile PATCH, no migration),
 * consumed by the person-detail tabs, the Today board, the daily digest
 * email, and the mobile app. Unknown/missing keys default to true, so new
 * systems are visible until a user explicitly turns them off.
 *
 * Lives in the engine because web (server + client) and mobile must agree
 * on the key set byte for byte: the digest filters its sections through
 * the exact same resolver the two clients render from. Framework-free on
 * purpose — no React, no Next, no React Native.
 *
 * Mobile imports the deep path (`@pleiad/engine/services/system-preferences`);
 * the package's `./*` exports map has no barrel entry for subdirectories.
 */

// Reading systems (person tabs + standalone pages)
export type ReadingSystemKey =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'astrology'
  | 'humandesign'
  | 'gematria'
  | 'numerology'
  | 'bazi'
  | 'genekeys'
  | 'oracles'

// Calendars & sky (Today board rows + digest lines)
export type CalendarSystemKey =
  | 'moon'
  | 'sidereal'
  | 'hebrew'
  | 'hijri'
  | 'persian'
  | 'chinese'
  | 'panchang'

export type SystemKey = ReadingSystemKey | CalendarSystemKey

/** Reading systems in IA order — tabs and pages render in this sequence. */
export const READING_SYSTEM_KEYS: readonly ReadingSystemKey[] = [
  'dreamspell',
  'tzolkin',
  'longcount',
  'astrology',
  'humandesign',
  'gematria',
  'numerology',
  'bazi',
  'genekeys',
  'oracles',
] as const

/** Calendars & sky in Today-board order. */
export const CALENDAR_SYSTEM_KEYS: readonly CalendarSystemKey[] = [
  'moon',
  'sidereal',
  'hebrew',
  'hijri',
  'persian',
  'chinese',
  'panchang',
] as const

export const SYSTEM_KEYS: readonly SystemKey[] = [
  ...READING_SYSTEM_KEYS,
  ...CALENDAR_SYSTEM_KEYS,
] as const

// Default - all systems enabled
export const DEFAULT_SYSTEM_PREFERENCES: Record<SystemKey, boolean> = {
  dreamspell: true,
  tzolkin: true,
  longcount: true,
  astrology: true,
  humandesign: true,
  gematria: true,
  numerology: true,
  bazi: true,
  genekeys: true,
  oracles: true,
  moon: true,
  sidereal: true,
  hebrew: true,
  hijri: true,
  persian: true,
  chinese: true,
  panchang: true,
}

export type SystemGroup = 'readings' | 'calendars'

export interface SystemInfo {
  readonly key: SystemKey
  readonly label: string
  readonly description: string
  readonly group: SystemGroup
  /** Needs a birth time before it can say anything true. */
  readonly requiresTime?: boolean
  /** Needs a birth place before it can say anything true. */
  readonly requiresLocation?: boolean
}

/**
 * The chooser's copy, shared so web and mobile can't drift apart on what a
 * system is called or what it needs. Icons stay platform-side (lucide on
 * web, phosphor on mobile) — they're the one part that can't be shared.
 */
export const SYSTEM_CATALOG: readonly SystemInfo[] = [
  {
    key: 'dreamspell',
    label: 'Dreamspell',
    description: 'Modern Mayan calendar system by Jose Arguelles',
    group: 'readings',
  },
  {
    key: 'tzolkin',
    label: 'Tzolkin',
    description: 'Traditional Mayan 260-day sacred calendar',
    group: 'readings',
  },
  {
    key: 'longcount',
    label: 'Long Count',
    description: 'Ancient Mayan long count calendar system',
    group: 'readings',
  },
  {
    key: 'astrology',
    label: 'Astrology',
    description: 'Western natal chart astrology',
    group: 'readings',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'humandesign',
    label: 'Human Design',
    description: 'Bodygraph analysis combining multiple systems',
    group: 'readings',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'gematria',
    label: 'Gematria',
    description: 'Hebrew numerology based on letter values',
    group: 'readings',
  },
  {
    key: 'numerology',
    label: 'Numerology',
    description: 'Pythagorean numbers from name and birth date',
    group: 'readings',
  },
  {
    key: 'bazi',
    label: 'BaZi',
    description: 'Chinese Four Pillars of Destiny',
    group: 'readings',
  },
  {
    key: 'genekeys',
    label: 'Gene Keys',
    description: 'The Golden Path — shadow, gift, and siddhi',
    group: 'readings',
    requiresTime: true,
  },
  {
    key: 'oracles',
    label: 'Oracles',
    description: 'Daily tarot, I Ching, and rune draws',
    group: 'readings',
  },
  {
    key: 'moon',
    label: 'Moon phase',
    description: 'The lunar phase on the Today board and daily brief',
    group: 'calendars',
  },
  {
    key: 'sidereal',
    label: 'Sidereal',
    description: 'The sidereal zodiac position of the Sun',
    group: 'calendars',
  },
  {
    key: 'hebrew',
    label: 'Hebrew calendar',
    description: 'The lunisolar Hebrew date',
    group: 'calendars',
  },
  {
    key: 'hijri',
    label: 'Hijri calendar',
    description: 'The Islamic lunar date',
    group: 'calendars',
  },
  {
    key: 'persian',
    label: 'Persian calendar',
    description: 'The Solar Hijri date',
    group: 'calendars',
  },
  {
    key: 'chinese',
    label: 'Chinese calendar',
    description: 'The sexagenary year and lunisolar month',
    group: 'calendars',
  },
  {
    key: 'panchang',
    label: 'Panchang',
    description: 'The Vedic lunar day (tithi) and paksha',
    group: 'calendars',
  },
] as const

/**
 * Merge stored preferences over the all-true defaults; anything unknown
 * stays visible. Accepts the raw `profile.preferences` jsonb value.
 */
export function resolveSystemPreferences(
  preferences: unknown
): Record<SystemKey, boolean> {
  const prefs = (preferences ?? {}) as { systems?: Record<string, boolean> }
  if (!prefs.systems || typeof prefs.systems !== 'object') {
    return DEFAULT_SYSTEM_PREFERENCES
  }
  return { ...DEFAULT_SYSTEM_PREFERENCES, ...prefs.systems }
}
