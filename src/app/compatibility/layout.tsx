import { Metadata } from 'next'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Free Dreamspell Compatibility - Check Your Cosmic Connection',
  description: 'Free Dreamspell compatibility calculator. Discover your cosmic connection with another person based on galactic signatures, oracles, and color families.',
  keywords: 'dreamspell compatibility, relationship astrology, kin compatibility, cosmic connection, mayan astrology, galactic relationship',
  alternates: {
    canonical: '/compatibility',
  },
  openGraph: {
    title: 'Free Dreamspell Compatibility - Check Your Cosmic Connection',
    description: 'Discover your cosmic connection based on Dreamspell galactic signatures. Free compatibility tool.',
    url: '/compatibility',
  },
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Check Dreamspell Compatibility",
  "description": "Compare two people's Dreamspell galactic signatures to discover their cosmic connection.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Enter two birth dates",
      "text": "Enter your birth date and a partner's, friend's, or family member's birth date to compare galactic signatures.",
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "View connections",
      "text": "See how your Solar Seals, Galactic Tones, and color families relate, including oracle connections and wavespell alignment.",
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Compare across systems",
      "text": "With a free account, compare compatibility across Dreamspell, Human Design, and Astrology in one view.",
    },
  ],
  "totalTime": "PT2M",
  "tool": "Web browser",
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Compatibility', url: `${SITE_URL}/compatibility` },
])

export default function CompatibilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={howToSchema} id="json-ld-howto" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      {children}
    </>
  )
}
