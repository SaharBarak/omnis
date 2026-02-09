'use client'

import { motion } from 'framer-motion'
import { ScrollScale, ScrollReveal } from './scroll-animations'
import { landingImages } from '@/lib/landing-images'

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

// ============================================
// FEATURE VISUALS — consistent image-based
// ============================================

function FeatureImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/3] border border-border overflow-hidden bg-[#0a0a0f]">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// ============================================
// FEATURES
// ============================================

const features = [
  {
    label: 'PERSONAL CHART',
    heading: 'Your complete chart',
    body: 'Human Design bodygraph, Dreamspell oracle, astrology natal chart, Tzolkin day sign, and Kabbalah numerology — all calculated from your birth data and displayed in a single professional view. No more switching between four websites.',
    visual: <FeatureImage src={landingImages.features.chart} alt="Chart view showing bodygraph and system data" />,
    imageFirst: true,
    slideVariant: 'slide-left' as const,
  },
  {
    label: 'AI COMPANION',
    heading: 'An AI that knows your chart',
    body: 'Ask questions about your design, your kin, your planetary placements. The AI reads your complete profile and gives interpretations grounded in each system\'s framework. Not generic horoscopes — responses based on your actual data.',
    visual: <FeatureImage src={landingImages.features.ai} alt="AI companion chat interface" />,
    imageFirst: false,
    slideVariant: 'slide-right' as const,
  },
  {
    label: 'RELATIONSHIP BOARD',
    heading: 'See how people connect',
    body: 'Add your family, friends, clients. See the dynamics across all systems — composite charts, oracle connections, type interactions. Filter by system. The interactive board visualizes connections as vector lines on a dotted canvas.',
    visual: <FeatureImage src={landingImages.features.board} alt="Relationship board with connected profiles" />,
    imageFirst: true,
    slideVariant: 'slide-left' as const,
  },
]

export function Features() {
  return (
    <section className="py-28 lg:py-36 px-6 bg-background" id="features">
      <div className="max-w-content mx-auto space-y-28 lg:space-y-36">
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className={`grid lg:grid-cols-2 gap-16 lg:gap-20 items-center ${
              feature.imageFirst ? '' : 'lg:[direction:rtl] lg:[&>*]:![direction:ltr]'
            }`}
          >
            {/* Visual */}
            <ScrollReveal variant={feature.slideVariant} once>
              <ScrollScale>
                {feature.visual}
              </ScrollScale>
            </ScrollReveal>

            {/* Text */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.div
                className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-sans"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
              >
                {feature.label}
              </motion.div>

              <motion.h2
                className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground tracking-tight"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
              >
                {feature.heading}
              </motion.h2>

              <motion.p
                className="text-lg text-muted-foreground leading-relaxed"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
              >
                {feature.body}
              </motion.p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  )
}
