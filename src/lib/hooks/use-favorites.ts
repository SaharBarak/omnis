'use client'

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

/**
 * Favorites (#78) — user bookmarks stored on the profile under
 * `preferences.favorites`, so they ride the existing profile PATCH and
 * survive across devices without a new table. An entry is a route plus
 * the title it wore when starred.
 */

export interface FavoriteEntry {
  readonly href: string
  readonly title: string
  /** ISO timestamp, newest last. */
  readonly addedAt: string
}

function readFavorites(preferences: unknown): FavoriteEntry[] {
  if (typeof preferences !== 'object' || preferences === null) return []
  const raw = (preferences as Record<string, unknown>).favorites
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (f): f is FavoriteEntry =>
      typeof f === 'object' && f !== null &&
      typeof (f as FavoriteEntry).href === 'string' &&
      typeof (f as FavoriteEntry).title === 'string'
  )
}

export function useFavorites() {
  const { profile, updateProfile } = useAuth()

  const favorites = useMemo(
    () => readFavorites(profile?.preferences),
    [profile?.preferences]
  )

  const isFavorite = useCallback(
    (href: string) => favorites.some((f) => f.href === href),
    [favorites]
  )

  const toggle = useCallback(
    async (entry: { href: string; title: string }) => {
      const next = favorites.some((f) => f.href === entry.href)
        ? favorites.filter((f) => f.href !== entry.href)
        : [...favorites, { ...entry, addedAt: new Date().toISOString() }]
      await updateProfile({
        preferences: {
          ...((profile?.preferences ?? {}) as Record<string, unknown>),
          favorites: next,
        },
      })
    },
    [favorites, profile?.preferences, updateProfile]
  )

  return { favorites, isFavorite, toggle, loaded: profile !== null && profile !== undefined }
}
