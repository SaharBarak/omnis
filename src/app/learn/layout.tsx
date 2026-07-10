import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Pleiad Knowledge Base',
    default: 'Learn - Pleiad Knowledge Base',
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
