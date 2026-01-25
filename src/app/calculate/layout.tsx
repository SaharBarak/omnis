import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dreamspell Calculator - Calculate Your Galactic Signature',
  description: 'Free Dreamspell Kin calculator. Enter your birth date to discover your galactic signature, solar seal, galactic tone, and personal mantra.',
  keywords: 'dreamspell calculator, kin calculator, galactic signature, mayan calendar, birth chart',
  openGraph: {
    title: 'Dreamspell Calculator - Find Your Galactic Signature',
    description: 'Discover your Dreamspell Kin, solar seal, and cosmic purpose. Free calculator.',
    url: 'https://omnis.app/calculate',
  },
}

export default function CalculateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
