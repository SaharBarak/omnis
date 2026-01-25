import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Learn - Explore Ancient Wisdom Systems | Omnis',
  description: 'Discover the wisdom of Dreamspell, Human Design, Astrology, and Gematria. Free educational resources to understand your cosmic blueprint.',
  keywords: 'dreamspell, human design, astrology, gematria, learn, education, wisdom, cosmic',
}

const systems = [
  {
    name: 'Dreamspell',
    href: '/learn/dreamspell',
    icon: '🌀',
    color: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/30',
    description: 'The Mayan-inspired 13:20 timing frequency. Discover your galactic signature and daily kin.',
    topics: ['260 Kin Cycle', 'Wavespells', 'Oracle', 'Castles'],
  },
  {
    name: 'Human Design',
    href: '/learn/human-design',
    icon: '🔮',
    color: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
    description: 'Your energetic blueprint based on birth data. Understand your type, authority, and strategy.',
    topics: ['Types', 'Authority', 'Centers', 'Gates & Channels'],
  },
  {
    name: 'Astrology',
    href: '/learn/astrology',
    icon: '⭐',
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
    description: 'The cosmic language of planets and signs. Explore your natal chart and planetary influences.',
    topics: ['Zodiac Signs', 'Planets', 'Houses', 'Aspects'],
  },
  {
    name: 'Gematria',
    href: '/learn/gematria',
    icon: '🔢',
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30',
    description: 'Hebrew letter numerology revealing hidden meanings. Calculate the numeric value of names.',
    topics: ['Hebrew Letters', 'Calculation Methods', 'Notable Numbers', 'Name Analysis'],
  },
]

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-gold-gradient">Learn</span> the Wisdom
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore four powerful systems that reveal different facets of your cosmic blueprint.
              Each offers unique insights into who you are and your path forward.
            </p>
          </div>

          {/* Systems Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {systems.map((system) => (
              <Link
                key={system.name}
                href={system.href}
                className={`group glass rounded-xl p-6 border ${system.borderColor} hover:border-accent/50 transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${system.color} flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform`}>
                  {system.icon}
                </div>

                <h2 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                  {system.name}
                </h2>

                <p className="text-muted-foreground mb-4">
                  {system.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {system.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 text-xs rounded-full bg-white/5 text-muted-foreground"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more →
                </div>
              </Link>
            ))}
          </div>

          {/* Cross-System Insight */}
          <div className="glass rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Why Multiple Systems?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Each system captures different dimensions of your cosmic identity. Like viewing a diamond from multiple angles,
              combining these perspectives creates a richer, more complete understanding of who you are.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border hover:bg-white/5 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
