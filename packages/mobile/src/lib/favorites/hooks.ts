import type { Profile } from '@pleiad/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api, useProfile } from '@/lib/api'
import { showToast } from '@/lib/toast'

/**
 * Favorites (#78) — bookmarks stored on the profile under
 * `preferences.favorites`, riding the existing profile PATCH.
 *
 * Entries are keyed by **web path**, matching the web app exactly, because a
 * star is one bookmark across both platforms: store a mobile route here and
 * the same page would show up twice, once per device the user starred it on.
 * `mobileRouteFor()` turns the stored path back into somewhere to go.
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
    (entry): entry is FavoriteEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as FavoriteEntry).href === 'string' &&
      typeof (entry as FavoriteEntry).title === 'string'
  )
}

export function useFavorites() {
  const profile = useProfile()
  const queryClient = useQueryClient()

  const favorites = readFavorites(profile.data?.preferences)

  const mutation = useMutation<
    Profile,
    unknown,
    FavoriteEntry[],
    { previous: Profile | undefined }
  >({
    mutationFn: (next) =>
      api.profile.update({
        preferences: {
          ...((profile.data?.preferences ?? {}) as Record<string, unknown>),
          favorites: next,
        },
      }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      const previous = queryClient.getQueryData<Profile>(['profile'])
      if (previous !== undefined) {
        queryClient.setQueryData<Profile>(['profile'], {
          ...previous,
          preferences: {
            ...(previous.preferences as Record<string, unknown>),
            favorites: next,
          } as unknown as Profile['preferences'],
        })
      }
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(['profile'], context?.previous)
      showToast("The star didn't hold. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const isFavorite = (href: string): boolean =>
    favorites.some((entry) => entry.href === href)

  const toggle = (entry: { href: string; title: string }) => {
    const starred = isFavorite(entry.href)
    const next = starred
      ? favorites.filter((existing) => existing.href !== entry.href)
      : [...favorites, { ...entry, addedAt: new Date().toISOString() }]
    mutation.mutate(next)
  }

  return {
    favorites,
    isFavorite,
    toggle,
    /** False while the profile is still in flight — don't paint a hollow star. */
    loaded: profile.data !== undefined,
  }
}
