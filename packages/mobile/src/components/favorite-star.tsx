import { StarIcon } from 'phosphor-react-native'

import { IconButton } from '@/components/m3'
import { useFavorites } from '@/lib/favorites/hooks'

/**
 * The star that any screen can wear in its top app bar (#78).
 *
 * `href` is the **web** path for this screen — favorites are one list across
 * both platforms, so the web path is the bookmark's identity. See
 * `lib/favorites/hooks.ts`.
 */
export function FavoriteStar({ href, title }: { href: string; title: string }) {
  const { isFavorite, toggle, loaded } = useFavorites()
  const starred = isFavorite(href)

  return (
    <IconButton
      icon={(color) => (
        <StarIcon size={24} color={color} weight={starred ? 'fill' : 'regular'} />
      )}
      onPress={() => toggle({ href, title })}
      disabled={!loaded}
      accessibilityLabel={starred ? `Unstar ${title}` : `Star ${title}`}
    />
  )
}
