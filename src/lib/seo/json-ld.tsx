import Script from 'next/script'

export const SITE_URL = 'https://omnis.app'

export function JsonLd({ data, id }: { data: Record<string, unknown>; id?: string }) {
  return (
    <Script
      id={id || 'json-ld'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const organizationSchema = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'OmnisX',
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

export function buildBreadcrumbs(
  items: { name: string; url: string }[]
) {
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
