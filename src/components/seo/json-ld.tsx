/**
 * Reusable JSON-LD structured-data primitives for the public marketing surface.
 *
 * Renders schema.org data as an inline `<script type="application/ld+json">`
 * so it is present in the server-rendered HTML. (Do NOT use `next/script`
 * here — its default `afterInteractive` strategy injects the tag client-side,
 * which hides structured data from non-JS crawlers and AI answer engines.)
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://omnis.app'

export const SITE_NAME = 'OmnisX'

export const ORGANIZATION_ID = `${SITE_URL}/#organization`

export type JsonLdData = Record<string, unknown>

/** Escape `<` to prevent `</script>` breakout when serializing into HTML. */
const serialize = (data: JsonLdData): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

export function JsonLd({ data, id }: { data: JsonLdData; id?: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Site-wide entities                                                  */
/* ------------------------------------------------------------------ */

export const organizationSchema: JsonLdData = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/apple-touch-icon.png`,
    width: 180,
    height: 180,
  },
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@omnis.app',
    url: `${SITE_URL}/contact`,
  },
}

export const webSiteSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    'The living map of the people in your life — read through six wisdom systems, remembered forever.',
  publisher: { '@id': ORGANIZATION_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/calculate?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

/**
 * The product entity. No aggregateRating: schema.org ratings must reflect
 * real, user-visible reviews — fabricated ratings risk manual actions.
 */
export const softwareApplicationSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': ['SoftwareApplication', 'WebApplication'],
  '@id': `${SITE_URL}/#app`,
  name: SITE_NAME,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'A persistent map of the people in your life, read through six wisdom systems at once: Astrology, Dreamspell, traditional Tzolkin, Human Design, Hebrew Gematria, and an integration layer that braids them together.',
  publisher: { '@id': ORGANIZATION_ID },
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description:
        'Six-system personal reading, daily kin, and a small people library.',
    },
    {
      '@type': 'Offer',
      name: 'Complete',
      price: '9',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description:
        'Unlimited people, full relationship map and group dynamics, AI interpretations. Billed monthly.',
    },
    {
      '@type': 'Offer',
      name: 'Practitioner',
      price: '29',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description:
        'Collaborators, client maps, and exports for professional readers. Billed monthly.',
    },
  ],
  featureList: [
    'Living relationship map across six wisdom systems',
    'Six-system personal reading from one birthday',
    'Persistent people library — enter a birthday once',
    'Group dynamics, layered or fused',
    'Shareable living map links',
    'Human Design Bodygraph',
    'Dreamspell Galactic Signature',
    'Astrology Natal Chart',
    'Traditional Tzolkin day sign',
    'Kabbalah & Hebrew Gematria',
  ],
}

/* ------------------------------------------------------------------ */
/* Per-page builders                                                   */
/* ------------------------------------------------------------------ */

export function buildBreadcrumbs(
  items: readonly { name: string; url: string }[]
): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildFaqPage(
  faqs: readonly { question: string; answer: string }[]
): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function buildArticle(article: {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  keywords?: readonly string[]
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    ...(article.keywords ? { keywords: [...article.keywords] } : {}),
    mainEntityOfPage: article.url,
  }
}

export function buildSpeakable(page: {
  name: string
  url: string
  cssSelectors: readonly string[]
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.name,
    url: page.url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [...page.cssSelectors],
    },
  }
}
