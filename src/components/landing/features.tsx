'use client'

import { motion } from 'framer-motion'
import { ScrollScale, ScrollReveal } from './scroll-animations'
import { systemGradients } from '@/lib/landing-images'

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
// MOCKUP VISUALS
// ============================================

function ChartVisual() {
  return (
    <div
      className="h-80 border border-border overflow-hidden"
      style={{ background: systemGradients['human-design'] }}
    >
      <div className="h-full flex items-center justify-center p-8">
        <svg viewBox="0 0 200 260" className="w-full h-full max-w-[180px] opacity-30">
          {/* Simplified bodygraph shape */}
          <circle cx="100" cy="30" r="18" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="100" cy="75" r="14" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="70" cy="110" r="12" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="130" cy="110" r="12" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="100" cy="140" r="14" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="100" cy="180" r="16" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="80" cy="215" r="12" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="120" cy="215" r="12" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="100" cy="245" r="10" fill="none" stroke="white" strokeWidth="1" />
          {/* Channels */}
          <line x1="100" y1="48" x2="100" y2="61" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="86" y1="82" x2="76" y2="100" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="114" y1="82" x2="124" y2="100" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="82" y1="116" x2="92" y2="130" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="118" y1="116" x2="108" y2="130" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="154" x2="100" y2="164" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="88" y1="192" x2="84" y2="205" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="112" y1="192" x2="116" y2="205" stroke="white" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

function AIChatVisual() {
  return (
    <div className="h-80 border border-border bg-card overflow-hidden flex flex-col justify-end p-6 gap-3">
      {/* User message */}
      <motion.div
        className="self-end max-w-[85%]"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-primary text-primary-foreground text-sm px-4 py-3 rounded-none">
          What does it mean that I&apos;m a Generator with a 6/2 profile?
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 text-right">You</div>
      </motion.div>

      {/* AI response */}
      <motion.div
        className="self-start max-w-[85%]"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <div className="bg-muted/50 border border-border text-foreground text-sm px-4 py-3 rounded-none">
          <p className="leading-relaxed">As a Generator 6/2, your strategy is to <span className="font-medium">wait to respond</span>. The 6th line means you go through three life phases: experimentation until ~30, withdrawal and observation until ~50, then becoming a <span className="font-medium">role model</span>...</p>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">Omnis AI</div>
      </motion.div>

      {/* Typing indicator */}
      <motion.div
        className="self-start"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <div className="flex gap-1 px-4 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-gentle-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-gentle-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-gentle-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>
    </div>
  )
}

function BoardVisual() {
  const nodes = [
    { x: 60, y: 50, initials: 'SM', delay: 0.1 },
    { x: 180, y: 40, initials: 'JK', delay: 0.2 },
    { x: 120, y: 140, initials: 'AR', delay: 0.3 },
    { x: 220, y: 130, initials: 'LM', delay: 0.4 },
  ]

  const lines = [
    { x1: 60, y1: 50, x2: 180, y2: 40 },
    { x1: 60, y1: 50, x2: 120, y2: 140 },
    { x1: 180, y1: 40, x2: 220, y2: 130 },
    { x1: 120, y1: 140, x2: 220, y2: 130 },
    { x1: 180, y1: 40, x2: 120, y2: 140 },
  ]

  return (
    <div className="h-80 border border-border bg-card overflow-hidden relative dotted-bg">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 200">
        {/* Connection lines */}
        {lines.map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
          />
        ))}

        {/* Avatar nodes */}
        {nodes.map((node) => (
          <motion.g
            key={node.initials}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: node.delay }}
          >
            <circle cx={node.x} cy={node.y} r="20" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontFamily="var(--font-heading)"
              fontWeight="500"
            >
              {node.initials}
            </text>
          </motion.g>
        ))}
      </svg>
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
    body: 'Human Design bodygraph, Dreamspell oracle, astrology natal chart, Tzolkin day sign, and Hebrew gematria — all calculated from your birth data and displayed in a single professional view. No more switching between four websites.',
    visual: <ChartVisual />,
    imageFirst: true,
    slideVariant: 'slide-left' as const,
  },
  {
    label: 'AI COMPANION',
    heading: 'An AI that knows your chart',
    body: 'Ask questions about your design, your kin, your planetary placements. The AI reads your complete profile and gives interpretations grounded in each system\'s framework. Not generic horoscopes — responses based on your actual data.',
    visual: <AIChatVisual />,
    imageFirst: false,
    slideVariant: 'slide-right' as const,
  },
  {
    label: 'RELATIONSHIP BOARD',
    heading: 'See how people connect',
    body: 'Add your family, friends, clients. See the dynamics across all systems — composite charts, oracle connections, type interactions. Filter by system. The interactive board visualizes connections as vector lines on a dotted canvas.',
    visual: <BoardVisual />,
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
