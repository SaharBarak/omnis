import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './use-auth'

// Mock Supabase client
const mockSignInWithOAuth = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: mockSelect.mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })),
  })),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })

    // Default mock for onAuthStateChange
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set up auth state listener on mount', () => {
      renderHook(() => useAuth())

      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    it('should clean up subscription on unmount', () => {
      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Auth State Changes', () => {
    it('should update state when user signs in', async () => {
      let authCallback: (event: string, session: unknown) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        }
      })

      mockSingle.mockResolvedValue({
        data: {
          user_id: 'user-123',
          first_name: 'Test',
          email: 'test@example.com',
          onboarding_completed: true,
        },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      // Simulate auth state change
      await act(async () => {
        authCallback('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@example.com' },
          access_token: 'token',
        })
      })

      await waitFor(() => {
        expect(result.current.user).toBeDefined()
        expect(result.current.loading).toBe(false)
      })
    })

    it('should clear state when user signs out', async () => {
      let authCallback: (event: string, session: unknown) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        }
      })

      const { result } = renderHook(() => useAuth())

      // Simulate sign out
      await act(async () => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should set loading to false after timeout if no session', async () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)

      // Advance timers by 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('signInWithGoogle', () => {
    it('should call supabase signInWithOAuth with google provider', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('should include redirectTo in callback URL when provided', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithGoogle('/app/dashboard')
      })

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('redirectTo=%2Fapp%2Fdashboard'),
        },
      })
    })

    it('should throw error when OAuth fails', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: new Error('OAuth error') })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signInWithGoogle()
        })
      ).rejects.toThrow('OAuth error')
    })
  })

  describe('signInWithApple', () => {
    it('should call supabase signInWithOAuth with apple provider', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithApple()
      })

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'apple',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })
  })

  describe('signInWithEmail', () => {
    it('should call supabase signInWithOtp with email', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithEmail('test@example.com')
      })

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('should include redirectTo in email redirect URL when provided', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithEmail('test@example.com', '/profile')
      })

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('redirectTo=%2Fprofile'),
        },
      })
    })

    it('should throw error when OTP fails', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: new Error('Email error') })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signInWithEmail('test@example.com')
        })
      ).rejects.toThrow('Email error')
    })
  })

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSignOut).toHaveBeenCalled()
    })

    it('should throw error when signOut fails', async () => {
      mockSignOut.mockResolvedValue({ error: new Error('Sign out error') })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signOut()
        })
      ).rejects.toThrow('Sign out error')
    })
  })

  describe('updateProfile', () => {
    it('should throw error when not authenticated', async () => {
      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.updateProfile({ first_name: 'Updated' })
        })
      ).rejects.toThrow('Not authenticated')
    })

    it('should call update with correct parameters when authenticated', async () => {
      let authCallback: (event: string, session: unknown) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        }
      })

      // Mock profile fetch for sign in
      mockSingle.mockResolvedValue({
        data: {
          user_id: 'user-123',
          first_name: 'Original',
          email: 'test@example.com',
        },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      // Simulate sign in
      await act(async () => {
        authCallback('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@example.com' },
          access_token: 'token',
        })
      })

      await waitFor(() => {
        expect(result.current.user).toBeDefined()
      })

      // Update profile - verify the update mock is called
      await act(async () => {
        await result.current.updateProfile({ first_name: 'Updated' })
      })

      // Verify update was called with the right data
      expect(mockUpdate).toHaveBeenCalledWith({ first_name: 'Updated' })
    })
  })

  describe('Computed Properties', () => {
    it('should return isAuthenticated as false when no user', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should return needsOnboarding as falsy when no user', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.needsOnboarding).toBeFalsy()
    })
  })

  describe('Profile Fetching', () => {
    it('should handle profile not found error gracefully', async () => {
      let authCallback: (event: string, session: unknown) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        }
      })

      // Mock profile not found (PGRST116 error code)
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const { result } = renderHook(() => useAuth())

      // Simulate sign in
      await act(async () => {
        authCallback('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@example.com' },
          access_token: 'token',
        })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile).toBeNull()
    })

    it('should log error for non-PGRST116 profile errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      let authCallback: (event: string, session: unknown) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        }
      })

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      const { result } = renderHook(() => useAuth())

      // Simulate sign in
      await act(async () => {
        authCallback('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@example.com' },
          access_token: 'token',
        })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should have logged an error (either 'Error' or 'Exception')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
