import { MetadataRoute } from 'next'
import { SITE_URL } from '@/components/seo/json-ld'

type Route = {
  readonly path: string
  readonly changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]['changeFrequency']
  >
  readonly priority: number
}

/**
 * Public, indexable marketing routes only.
 * Excluded on purpose: /login (no search value), /app/** (authed, noindex),
 * /share/** (private tokens), /onboarding, /unsubscribe.
 */
const PUBLIC_ROUTES: readonly Route[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/today', changeFrequency: 'daily', priority: 0.9 },
  { path: '/calculate', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/compatibility', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/learn', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/learn/dreamspell', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/tzolkin', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/human-design', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/astrology', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/gematria', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/integration', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
