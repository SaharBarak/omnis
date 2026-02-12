/**
 * Landing page image paths.
 * Components use these paths and render gradient placeholders when images don't exist.
 * Drop nano-generated images into /public/images/landing/ to activate them.
 */

export const landingImages = {
  hero: {
    background: '/images/landing/hero/hero-bg.webp',
  },
  systems: {
    dreamspell: '/images/landing/systems/dreamspell.webp',
    astrology: '/images/landing/systems/astrology.webp',
    'human-design': '/images/landing/systems/human-design.webp',
    gematria: '/images/landing/systems/gematria.webp',
    tzolkin: '/images/landing/systems/tzolkin.webp',
  },
  features: {
    chart: '/images/landing/features/chart.webp',
    ai: '/images/landing/features/ai.webp',
    board: '/images/landing/features/board.webp',
  },
  steps: {
    '01': '/images/landing/steps/step-01.webp',
    '02': '/images/landing/steps/step-02.webp',
    '03': '/images/landing/steps/step-03.webp',
  },
} as const

/** Gradient placeholders for each system — used when image is missing */
export const systemGradients: Record<string, string> = {
  dreamspell: 'linear-gradient(135deg, hsl(175 30% 18%), hsl(175 40% 30%))',
  astrology: 'linear-gradient(135deg, hsl(42 40% 20%), hsl(42 60% 35%))',
  'human-design': 'linear-gradient(135deg, hsl(200 30% 16%), hsl(200 35% 28%))',
  gematria: 'linear-gradient(135deg, hsl(230 30% 18%), hsl(230 40% 30%))',
  tzolkin: 'linear-gradient(135deg, hsl(160 25% 18%), hsl(160 35% 28%))',
}

export const stepGradients: Record<string, string> = {
  '01': 'linear-gradient(135deg, hsl(257 30% 92%), hsl(257 20% 96%))',
  '02': 'linear-gradient(135deg, hsl(257 25% 90%), hsl(42 20% 95%))',
  '03': 'linear-gradient(135deg, hsl(180 20% 90%), hsl(257 20% 94%))',
}
