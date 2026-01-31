import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSystemPreferences, DEFAULT_SYSTEM_PREFERENCES, type SystemKey } from './use-system-preferences'

// Mock the useAuth hook
const mockProfile = vi.fn()
const mockLoading = vi.fn()

vi.mock('./use-auth', () => ({
  useAuth: () => ({
    profile: mockProfile(),
    loading: mockLoading(),
  }),
}))

describe('useSystemPreferences Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile.mockReturnValue(null)
    mockLoading.mockReturnValue(false)
  })

  describe('DEFAULT_SYSTEM_PREFERENCES', () => {
    it('should have all systems enabled by default', () => {
      expect(DEFAULT_SYSTEM_PREFERENCES.dreamspell).toBe(true)
      expect(DEFAULT_SYSTEM_PREFERENCES.tzolkin).toBe(true)
      expect(DEFAULT_SYSTEM_PREFERENCES.longcount).toBe(true)
      expect(DEFAULT_SYSTEM_PREFERENCES.astrology).toBe(true)
      expect(DEFAULT_SYSTEM_PREFERENCES.humandesign).toBe(true)
      expect(DEFAULT_SYSTEM_PREFERENCES.gematria).toBe(true)
    })

    it('should have exactly 6 systems', () => {
      expect(Object.keys(DEFAULT_SYSTEM_PREFERENCES)).toHaveLength(6)
    })
  })

  describe('enabledSystems', () => {
    it('should return default preferences when no profile exists', () => {
      mockProfile.mockReturnValue(null)

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.enabledSystems).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    })

    it('should return default preferences when profile has no preferences', () => {
      mockProfile.mockReturnValue({})

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.enabledSystems).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    })

    it('should return default preferences when profile preferences has no systems', () => {
      mockProfile.mockReturnValue({
        preferences: { theme: 'dark' },
      })

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.enabledSystems).toEqual(DEFAULT_SYSTEM_PREFERENCES)
    })

    it('should merge profile systems with defaults', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {
            dreamspell: false,
            astrology: false,
          },
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.enabledSystems.dreamspell).toBe(false)
      expect(result.current.enabledSystems.astrology).toBe(false)
      expect(result.current.enabledSystems.tzolkin).toBe(true)
      expect(result.current.enabledSystems.longcount).toBe(true)
      expect(result.current.enabledSystems.humandesign).toBe(true)
      expect(result.current.enabledSystems.gematria).toBe(true)
    })

    it('should handle all systems being disabled', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {
            dreamspell: false,
            tzolkin: false,
            longcount: false,
            astrology: false,
            humandesign: false,
            gematria: false,
          },
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      Object.keys(result.current.enabledSystems).forEach(system => {
        expect(result.current.enabledSystems[system as SystemKey]).toBe(false)
      })
    })

    it('should use profile preference over default when explicitly set', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {
            dreamspell: true, // Explicitly set to true
          },
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.enabledSystems.dreamspell).toBe(true)
    })
  })

  describe('isSystemEnabled', () => {
    it('should return true for all systems when no profile', () => {
      mockProfile.mockReturnValue(null)

      const { result } = renderHook(() => useSystemPreferences())

      const systems: SystemKey[] = ['dreamspell', 'tzolkin', 'longcount', 'astrology', 'humandesign', 'gematria']
      systems.forEach(system => {
        expect(result.current.isSystemEnabled(system)).toBe(true)
      })
    })

    it('should return correct value for enabled systems', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {
            dreamspell: true,
            tzolkin: false,
          },
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.isSystemEnabled('dreamspell')).toBe(true)
      expect(result.current.isSystemEnabled('tzolkin')).toBe(false)
    })

    it('should return true for systems not explicitly set in preferences', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {
            dreamspell: false,
          },
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.isSystemEnabled('tzolkin')).toBe(true)
      expect(result.current.isSystemEnabled('longcount')).toBe(true)
    })

    it('should default to true for unknown systems', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: {},
        },
      })

      const { result } = renderHook(() => useSystemPreferences())

      // Cast to any to test with a hypothetical unknown system
      expect(result.current.isSystemEnabled('unknown' as SystemKey)).toBe(true)
    })
  })

  describe('loading state', () => {
    it('should propagate loading state from useAuth', () => {
      mockLoading.mockReturnValue(true)

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.loading).toBe(true)
    })

    it('should return false when auth is not loading', () => {
      mockLoading.mockReturnValue(false)

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current.loading).toBe(false)
    })
  })

  describe('memoization', () => {
    it('should return same enabledSystems reference when profile does not change', () => {
      const profile = {
        preferences: {
          systems: { dreamspell: false },
        },
      }
      mockProfile.mockReturnValue(profile)

      const { result, rerender } = renderHook(() => useSystemPreferences())
      const firstResult = result.current.enabledSystems

      rerender()

      // Same profile should result in same memoized object
      expect(result.current.enabledSystems).toBe(firstResult)
    })

    it('should update enabledSystems when profile changes', () => {
      mockProfile.mockReturnValue({
        preferences: {
          systems: { dreamspell: false },
        },
      })

      const { result, rerender } = renderHook(() => useSystemPreferences())
      expect(result.current.enabledSystems.dreamspell).toBe(false)

      // Update profile
      mockProfile.mockReturnValue({
        preferences: {
          systems: { dreamspell: true },
        },
      })

      rerender()

      expect(result.current.enabledSystems.dreamspell).toBe(true)
    })
  })

  describe('return value structure', () => {
    it('should return object with enabledSystems, isSystemEnabled, and loading', () => {
      mockProfile.mockReturnValue(null)

      const { result } = renderHook(() => useSystemPreferences())

      expect(result.current).toHaveProperty('enabledSystems')
      expect(result.current).toHaveProperty('isSystemEnabled')
      expect(result.current).toHaveProperty('loading')
      expect(typeof result.current.isSystemEnabled).toBe('function')
    })
  })
})
