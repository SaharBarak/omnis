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
