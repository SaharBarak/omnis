import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compatibility Check - Dreamspell Relationship Analysis',
  description: 'Free Dreamspell compatibility calculator. Discover your cosmic connection with another person based on your galactic signatures.',
  keywords: 'dreamspell compatibility, relationship astrology, kin compatibility, cosmic connection, mayan astrology',
  openGraph: {
    title: 'Dreamspell Compatibility Check',
    description: 'Discover your cosmic connection based on Dreamspell galactic signatures. Free tool.',
    url: 'https://omnis.app/compatibility',
  },
}

export default function CompatibilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
