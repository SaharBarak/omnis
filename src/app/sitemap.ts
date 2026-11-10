import { MetadataRoute } from 'next'
import { SITE_URL } from '@/components/seo/json-ld'
import { ARTICLES } from '@/components/bento-lab/docs/library'
import { SITE_ROUTES } from '@/lib/site/routes'

type Weight = {
  readonly changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  readonly priority: number
}

/**
 * Editorial weight by path (docs/redesign/V2_PROMOTION.md). The set of URLs is
 * derived from the route table's `indexed` rows, so a new public page appears
 * in the sitemap without touching this file; a path listed here only tunes its
 * frequency and priority. Rows not listed take the default.
 */
const WEIGHT: Readonly<Record<string, Weight>> = {
  '/': { changeFrequency: 'weekly', priority: 1 },
  '/today': { changeFrequency: 'daily', priority: 0.9 },
  '/map': { changeFrequency: 'monthly', priority: 0.8 },
  '/pair': { changeFrequency: 'monthly', priority: 0.8 },
  '/circle': { changeFrequency: 'monthly', priority: 0.8 },
  '/learn': { changeFrequency: 'monthly', priority: 0.8 },
  '/pricing': { changeFrequency: 'monthly', priority: 0.7 },
  '/about': { changeFrequency: 'monthly', priority: 0.6 },
  '/contact': { changeFrequency: 'monthly', priority: 0.5 },
}

const DEFAULT: Weight = { changeFrequency: 'monthly', priority: 0.6 }

const ARTICLE: Weight = { changeFrequency: 'monthly', priority: 0.7 }

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const toUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

  const pages = SITE_ROUTES.filter((route) => route.indexed && !route.pattern).map((route) => ({
    url: toUrl(route.path),
    lastModified,
    ...(WEIGHT[route.path] ?? DEFAULT),
  }))

  const articles = ARTICLES.map((article) => ({
    url: toUrl(`/learn/${article.slug}`),
    lastModified,
    ...ARTICLE,
  }))

  return [...pages, ...articles]
}
