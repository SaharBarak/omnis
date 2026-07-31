import { describe, expect, it } from 'vitest'

import {
  CALENDAR_SYSTEM_KEYS,
  DEFAULT_SYSTEM_PREFERENCES,
  READING_SYSTEM_KEYS,
  SYSTEM_CATALOG,
  SYSTEM_KEYS,
  resolveSystemPreferences,
  type SystemKey,
} from './system-preferences'

describe('system preferences', () => {
  it('defaults every known system to visible', () => {
    for (const key of SYSTEM_KEYS) {
      expect(DEFAULT_SYSTEM_PREFERENCES[key]).toBe(true)
    }
  })

  it('covers every key exactly once in the catalog', () => {
    const catalogKeys = SYSTEM_CATALOG.map((s) => s.key)
    expect(new Set(catalogKeys).size).toBe(catalogKeys.length)
    expect([...catalogKeys].sort()).toEqual([...SYSTEM_KEYS].sort())
  })

  it('groups the catalog the way the key lists do', () => {
    const readings = SYSTEM_CATALOG.filter((s) => s.group === 'readings').map((s) => s.key)
    const calendars = SYSTEM_CATALOG.filter((s) => s.group === 'calendars').map((s) => s.key)
    expect(readings).toEqual([...READING_SYSTEM_KEYS])
    expect(calendars).toEqual([...CALENDAR_SYSTEM_KEYS])
  })

  it('falls back to all-visible for absent or malformed preferences', () => {
    expect(resolveSystemPreferences(undefined)).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    expect(resolveSystemPreferences(null)).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    expect(resolveSystemPreferences({})).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    expect(resolveSystemPreferences({ systems: 'nope' })).toEqual(DEFAULT_SYSTEM_PREFERENCES)
  })

  it('merges stored values over the defaults and keeps unknown systems visible', () => {
    const resolved = resolveSystemPreferences({ systems: { bazi: false } })
    expect(resolved.bazi).toBe(false)
    // A system added after this profile was last saved stays on.
    expect(resolved.genekeys).toBe(true)
  })

  it('ignores a stored key that is not a system', () => {
    const resolved = resolveSystemPreferences({ systems: { tarot: false } }) as Record<
      string,
      boolean
    >
    for (const key of SYSTEM_KEYS as readonly SystemKey[]) {
      expect(resolved[key]).toBe(true)
    }
  })
})
