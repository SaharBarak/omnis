'use client'

import { useEffect, useRef } from 'react'

const systems = [
  {
    icon: '🌀',
    name: 'Dreamspell',
    description: 'Your galactic signature, kin number, and oracle map',
    color: 'from-violet-500/20 to-blue-500/20',
  },
  {
    icon: '⭐',
    name: 'Astrology',
    description: 'Natal chart with all planets, houses, and aspects',
    color: 'from-orange-500/20 to-yellow-500/20',
  },
  {
    icon: '🔮',
    name: 'Human Design',
    description: 'Your energetic blueprint and decision strategy',
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: '🔢',
    name: 'Gematria',
    description: 'Hebrew name numerology and hidden meanings',
    color: 'from-green-500/20 to-teal-500/20',
  },
]

const additionalSystems = [
  'Long Count',
  'Wavespells',
  'Traditional Tzolkin',
  'Castles & Harmonics',
]

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    const cards = sectionRef.current?.querySelectorAll('.feature-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 px-4" id="features">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Four Systems. <span className="text-gold-gradient">One Truth.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stop checking multiple sites. Get all your symbolic readings in one place, calculated instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {systems.map((system, index) => (
            <div
              key={system.name}
              className={`feature-card group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 opacity-0 translate-y-4`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${system.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {system.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{system.name}</h3>
              <p className="text-sm text-muted-foreground">{system.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-muted-foreground">
          <span className="font-medium">Plus:</span>{' '}
          {additionalSystems.map((system, index) => (
            <span key={system}>
              {system}
              {index < additionalSystems.length - 1 && ' · '}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .feature-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  )
}
