import { Metadata } from 'next'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Free Dreamspell Calculator - Find Your Galactic Signature & Kin',
  description: 'Free Dreamspell Kin calculator. Enter your birth date to discover your galactic signature, solar seal, galactic tone, oracle, and personal mantra. Includes all 260 Kin.',
  keywords: 'dreamspell calculator, kin calculator, galactic signature, mayan calendar, birth chart, what is my kin, galactic signature calculator',
  alternates: {
    canonical: '/calculate',
  },
  openGraph: {
    title: 'Free Dreamspell Calculator - Find Your Galactic Signature & Kin',
    description: 'Discover your Dreamspell Kin, solar seal, and cosmic purpose. Free calculator for all 260 galactic signatures.',
    url: '/calculate',
  },
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Find Your Dreamspell Galactic Signature",
  "description": "Calculate your Dreamspell Kin number, Solar Seal, and Galactic Tone using our free calculator.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Enter your birth date",
      "text": "Select your date of birth using the calendar input. No birth time is required — only the date.",
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "View your galactic signature",
      "text": "See your Kin number (1-260), Solar Seal, Galactic Tone, color family, and personal mantra.",
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Explore your oracle",
      "text": "Discover your Guide, Analog, Antipode, and Occult power seals that form your complete Dreamspell oracle.",
    },
  ],
  "totalTime": "PT1M",
  "tool": "Web browser",
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Calculator', url: `${SITE_URL}/calculate` },
])

export default function CalculateLayout({
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
