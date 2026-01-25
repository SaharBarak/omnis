import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Learn Human Design - Your Energetic Blueprint | Omnis',
  description: 'Discover Human Design: your type, strategy, authority, and inner mechanics. Free educational guide to understanding your unique design.',
  keywords: 'human design, bodygraph, type, authority, strategy, generator, projector, manifestor, reflector',
}

const types = [
  {
    name: 'Manifestor',
    percentage: '~9%',
    strategy: 'Inform before acting',
    notSelf: 'Anger',
    description: 'Initiators who have direct access to manifesting energy. They are here to impact and initiate.',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/30',
  },
  {
    name: 'Generator',
    percentage: '~37%',
    strategy: 'Wait to respond',
    notSelf: 'Frustration',
    description: 'The life-force of the planet with sustainable energy. They are here to master and create.',
    color: 'from-orange-500/20 to-yellow-500/20',
    border: 'border-orange-500/30',
  },
  {
    name: 'Manifesting Generator',
    percentage: '~33%',
    strategy: 'Wait to respond, then inform',
    notSelf: 'Frustration/Anger',
    description: 'Multi-passionate beings with initiating and generating power. Fast-moving and efficient.',
    color: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
  },
  {
    name: 'Projector',
    percentage: '~20%',
    strategy: 'Wait for the invitation',
    notSelf: 'Bitterness',
    description: 'Guides and advisors who see deeply into others. Here to manage, direct, and guide.',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
  },
  {
    name: 'Reflector',
    percentage: '~1%',
    strategy: 'Wait a lunar cycle',
    notSelf: 'Disappointment',
    description: 'Rare mirrors of the community. Deeply connected to the lunar cycle and environment.',
    color: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-500/30',
  },
]

const authorities = [
  { name: 'Emotional', description: 'Wait for emotional clarity over time. Ride your emotional wave.' },
  { name: 'Sacral', description: 'Trust your gut response. Your body knows before your mind.' },
  { name: 'Splenic', description: 'Trust your instincts in the moment. Spontaneous knowing.' },
  { name: 'Ego', description: 'Heart-based willpower. What do you truly desire?' },
  { name: 'Self-Projected', description: 'Speak to hear your truth. Your identity guides you.' },
  { name: 'Mental', description: 'Talk it out with trusted others. External sounding board.' },
  { name: 'Lunar', description: 'Wait 28 days for major decisions. Sample all perspectives.' },
]

const centers = [
  { name: 'Head', function: 'Inspiration & Mental Pressure', color: 'bg-yellow-500' },
  { name: 'Ajna', function: 'Conceptualization & Analysis', color: 'bg-green-500' },
  { name: 'Throat', function: 'Communication & Manifestation', color: 'bg-amber-500' },
  { name: 'G Center', function: 'Identity, Love & Direction', color: 'bg-yellow-400' },
  { name: 'Heart/Ego', function: 'Willpower & Ego', color: 'bg-red-500' },
  { name: 'Sacral', function: 'Life Force & Sexuality', color: 'bg-red-600' },
  { name: 'Solar Plexus', function: 'Emotions & Spirit', color: 'bg-amber-600' },
  { name: 'Spleen', function: 'Intuition & Immune System', color: 'bg-amber-700' },
  { name: 'Root', function: 'Adrenaline & Drive', color: 'bg-amber-800' },
]

export default function HumanDesignLearnPage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-accent mb-4 inline-block">
              ← Back to Learn
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-gold-gradient">Human Design</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your unique energetic blueprint synthesizing astrology, the I Ching,
              Kabbalah, and the chakra system into one comprehensive map.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">5</div>
              <div className="text-sm text-muted-foreground">Energy Types</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">9</div>
              <div className="text-sm text-muted-foreground">Centers</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">64</div>
              <div className="text-sm text-muted-foreground">Gates</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">36</div>
              <div className="text-sm text-muted-foreground">Channels</div>
            </div>
          </div>

          {/* What is Human Design */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">What is Human Design?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Human Design is a synthesis system channeled by Ra Uru Hu in 1987. It combines
                Western Astrology, the I Ching, the Kabbalah Tree of Life, the Hindu-Brahmin chakra system,
                and quantum physics into a single framework.
              </p>
              <p>
                Your Human Design chart (Bodygraph) is calculated from your exact birth date, time, and location.
                It reveals your energetic type, decision-making authority, and how you&apos;re designed to interact
                with the world.
              </p>
              <p>
                <strong className="text-foreground">Note:</strong> Human Design requires precise birth time for accurate
                results. Without it, type and authority cannot be reliably determined.
              </p>
            </div>
          </section>

          {/* The 5 Types */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 5 Energy Types</h2>
            <p className="text-muted-foreground mb-6">
              Your Type determines your aura and how you best exchange energy with others.
            </p>

            <div className="space-y-4">
              {types.map((type) => (
                <div
                  key={type.name}
                  className={`p-4 rounded-xl border ${type.border} bg-gradient-to-r ${type.color}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{type.name}</h3>
                    <span className="text-sm text-muted-foreground">{type.percentage}</span>
                  </div>
                  <p className="text-muted-foreground mb-3">{type.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Strategy:</span>{' '}
                      <span className="text-foreground">{type.strategy}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Not-Self:</span>{' '}
                      <span className="text-red-400">{type.notSelf}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Authority */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Inner Authority</h2>
            <p className="text-muted-foreground mb-6">
              Authority is your personal decision-making mechanism — how you know what&apos;s correct for you.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {authorities.map((auth) => (
                <div key={auth.name} className="p-4 rounded-lg bg-white/5">
                  <h3 className="font-semibold text-accent mb-2">{auth.name}</h3>
                  <p className="text-sm text-muted-foreground">{auth.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Centers */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 9 Centers</h2>
            <p className="text-muted-foreground mb-6">
              Centers are energy hubs in your Bodygraph. Defined centers have consistent energy;
              undefined centers are where you take in and amplify others&apos; energy.
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              {centers.map((center) => (
                <div key={center.name} className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${center.color}`} />
                    <h3 className="font-medium text-sm">{center.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{center.function}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gates & Channels */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Gates & Channels</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">64 Gates</strong> correspond to the 64 hexagrams of the I Ching.
                Each gate represents a specific theme or archetype. Gates are activated by planetary positions
                at your birth.
              </p>
              <p>
                <strong className="text-foreground">36 Channels</strong> connect two centers through a pair of gates.
                When both gates in a channel are activated, the channel is defined, creating a fixed way of being.
              </p>
              <p>
                Your activated gates and channels reveal your gifts, tendencies, and life themes. They show
                where you have reliable access to certain energies.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Discover your Human Design type and authority.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/login">Get Your Chart</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/learn">Explore Other Systems</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
