import { MetadataRoute } from 'next'
import { SITE_URL } from '@/components/seo/json-ld'

/**
 * Private or no-search-value surfaces. `/share/` carries personal chart data
 * behind unlisted tokens — kept out of search and AI indexes by default.
 */
const PRIVATE_PATHS = [
  '/app/',
  '/api/',
  '/auth/',
  '/share/',
  '/onboarding',
  '/unsubscribe',
] as const

/**
 * AI search/answer crawlers are explicitly allowed on the public surface so
 * Pleiad can be cited by ChatGPT, Claude, Perplexity, Gemini, et al.
 * (Blocking them would remove the site from AI answers entirely.)
 */
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Google-Extended',
  'ClaudeBot',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'meta-externalagent',
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_PATHS],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...PRIVATE_PATHS],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
