import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/', '/onboarding', '/unsubscribe'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://omnis.app/sitemap.xml',
  }
}
