/**
 * Preferred-systems preference — re-export of the shared engine module so
 * web and mobile resolve `profile.preferences.systems` through the same
 * code. Semantics and the key set live in
 * `packages/engine/src/services/system-preferences.ts`.
 */

export {
  DEFAULT_SYSTEM_PREFERENCES,
  READING_SYSTEM_KEYS,
  CALENDAR_SYSTEM_KEYS,
  SYSTEM_KEYS,
  resolveSystemPreferences,
} from '@pleiad/engine/services/system-preferences'

export type {
  SystemKey,
  ReadingSystemKey,
  CalendarSystemKey,
} from '@pleiad/engine/services/system-preferences'
