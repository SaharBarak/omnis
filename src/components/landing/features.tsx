'use client'

import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const systems = [
  {
    name: 'Dreamspell',
    subtitle: 'Galactic Signature',
    description: 'Your kin, seal, tone, wavespell, castle, and complete oracle map. The synchronic order that Arguelles returned us to - where synchronicity can be mapped daily.',
    color: 'primary',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Astrology',
    subtitle: 'Natal Chart',
    description: 'Sun, Moon, Rising, and planetary placements. The ancient language of celestial positions at the moment of your birth.',
    color: 'secondary',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7">
        <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M16 6v4M16 22v4M6 16h4M22 16h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    name: 'Human Design',
    subtitle: 'Bodygraph',
    description: 'Type, strategy, authority, and profile. As Ra Uru Hu said: not a belief system - a practical tool for living as yourself, free from conditioning.',
    color: 'accent',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7">
        <circle cx="16" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="22" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="16" cy="26" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M16 12v11M13 18h6" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    name: 'Gematria',
    subtitle: 'Hebrew Numerology',
    description: 'Seven calculation methods from the Kabbalistic tradition. Words with the same numerical value reveal hidden connections in reality.',
    color: 'primary',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7">
        <rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
        <text x="16" y="21" textAnchor="middle" fontSize="12" fill="currentColor" fontFamily="serif">&#x05D0;</text>
      </svg>
    ),
  },
]

const additionalSystems = [
  { name: 'Long Count', desc: 'Your position in the great cycle' },
  { name: 'Tzolkin', desc: 'Traditional Mayan (GMT correlation)' },
  { name: 'Personal Timeline', desc: 'Galactic returns, tun & katun' },
  { name: 'Relationships', desc: 'Oracle connections between profiles' },
]

export function Features() {
  return (
    <section className="py-28 lg:py-36 px-6 bg-background" id="features">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <motion.div
          className="max-w-2xl mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.div className="earth-badge mb-5" variants={fadeInUp} transition={{ duration: 0.4 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>Close those 4 browser tabs</span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl font-heading text-foreground mb-5"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            Six systems, <span className="text-earth-gradient">one unified view</span>
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground leading-relaxed"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            Each tradition offers a different lens. Omnis calculates all of them and displays them together so you can see the connections.
          </motion.p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
        >
          {systems.map((system, index) => (
            <motion.div
              key={system.name}
              className="group feature-card-earth"
              variants={fadeInUp}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-${system.color}/10 text-${system.color} border border-${system.color}/20 transition-transform duration-300 group-hover:scale-105`}>
                {system.icon}
              </div>

              {/* Content */}
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-xl font-heading text-foreground">{system.name}</h3>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{system.subtitle}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{system.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional systems */}
        <motion.div
          className="mt-14 pt-10 border-t border-border/50"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground mr-1">Also included:</span>
            {additionalSystems.map((system) => (
              <div
                key={system.name}
                className="earth-badge"
              >
                <span className="text-sm font-medium text-foreground">{system.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">/ {system.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
