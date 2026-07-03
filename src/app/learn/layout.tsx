import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | OmnisX Knowledge Base',
    default: 'Learn - OmnisX Knowledge Base',
  },
  description: 'Comprehensive documentation for Dreamspell, Human Design, Astrology, Gematria, and traditional Tzolkin systems.',
}

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
