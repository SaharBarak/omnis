import type { MetadataRoute } from 'next'
import { BRAND, BRAND_TITLE } from '@/lib/brand/identity'

/**
 * PWA manifest — served at /manifest.webmanifest by the App Router.
 *
 * Makes Pleiad installable to the iOS/Android home screen with no app-store
 * review. Icons ship in /public/icons, drawn by `npm run brand:icons`; `purpose: 'maskable'` is kept on
 * a separate entry because Android crops maskable icons and iOS does not.
 *
 * `id` is pinned so a future change to `start_url` does not orphan installs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: BRAND_TITLE,
    short_name: BRAND.name,
    description:
      'Save the people in your life, read each one through Dreamspell, Tzolkin, Human Design, Astrology, and Hebrew Gematria, and compare the patterns between them.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0D16',
    theme_color: '#0B0D16',
    categories: ['lifestyle', 'education', 'social'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Calculate a chart',
        short_name: 'Calculate',
        url: '/calculate',
      },
    ],
  }
}
