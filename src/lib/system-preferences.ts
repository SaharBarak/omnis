/**
 * Preferred-systems preference — the single source of truth for "which
 * systems does this user want to see". Persisted on the profile under
 * `preferences.systems` (rides the existing profile PATCH, no migration),
 * consumed by the person-detail tabs, the Today board, and the daily
 * digest email. Unknown/missing keys default to true, so new systems are
 * visible until a user explicitly turns them off.
 *
 * Framework-free on purpose: the digest runs server-side in the cron
 * route and filters its sections through the exact same resolver the
 * client UI uses.
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
