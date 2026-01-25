import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/landing'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'

export const metadata: Metadata = {
  title: 'Learn Dreamspell - The Galactic Signature System | Omnis',
  description: 'Discover the Dreamspell system: 260 Kin cycle, 20 Solar Seals, 13 Galactic Tones, Wavespells, and the Oracle. Free educational guide.',
  keywords: 'dreamspell, galactic signature, kin, solar seals, galactic tones, wavespell, mayan calendar, 13:20',
}

const colorFamilies = [
  { color: 'red', meaning: 'Initiate, Birth, East', seals: [1, 5, 9, 13, 17] },
  { color: 'white', meaning: 'Refine, Purify, North', seals: [2, 6, 10, 14, 18] },
  { color: 'blue', meaning: 'Transform, Transmit, West', seals: [3, 7, 11, 15, 19] },
  { color: 'yellow', meaning: 'Ripen, Mature, South', seals: [4, 8, 12, 16, 20] },
]

export default function DreamspellLearnPage() {
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
              <span className="text-gold-gradient">Dreamspell</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The synchronic order of time based on the 13:20 frequency.
              Discover your galactic signature and the cosmic energies of each day.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">260</div>
              <div className="text-sm text-muted-foreground">Kin in Cycle</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">20</div>
              <div className="text-sm text-muted-foreground">Solar Seals</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">13</div>
              <div className="text-sm text-muted-foreground">Galactic Tones</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">5</div>
              <div className="text-sm text-muted-foreground">Oracle Relations</div>
            </div>
          </div>

          {/* What is Dreamspell */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">What is Dreamspell?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Dreamspell is a modern interpretation of Mayan timekeeping created by José Argüelles
                and Lloydine Argüelles in 1987. It operates on the 13:20 frequency — 13 tones × 20 seals = 260 unique
                combinations called &quot;Kin.&quot;
              </p>
              <p>
                Unlike the Gregorian calendar that measures time linearly, Dreamspell views time as
                a spiral of synchronicity. Each day carries specific energetic qualities that influence
                our experiences and potential.
              </p>
              <p>
                Your &quot;Galactic Signature&quot; is the Kin of your birthday — a cosmic fingerprint
                that reveals your purpose, challenges, and gifts.
              </p>
            </div>
          </section>

          {/* 20 Solar Seals */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 20 Solar Seals</h2>
            <p className="text-muted-foreground mb-6">
              The 20 Solar Seals represent archetypal energies. Each carries specific powers, actions, and essences.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {SEALS.map((seal) => (
                <div
                  key={seal.number}
                  className={`p-3 rounded-lg text-center border ${
                    seal.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
                    seal.color === 'white' ? 'bg-slate-100/5 border-slate-300/30' :
                    seal.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="text-lg font-bold">{seal.number}</div>
                  <div className="text-sm">{seal.english}</div>
                  <div className="text-xs text-muted-foreground">{seal.hebrew}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Color Families */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Color Families</h2>
            <p className="text-muted-foreground mb-6">
              The seals are grouped into four color families, each with a direction and function.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {colorFamilies.map((family) => (
                <div
                  key={family.color}
                  className={`p-4 rounded-lg border ${
                    family.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
                    family.color === 'white' ? 'bg-slate-100/5 border-slate-300/30' :
                    family.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <h3 className="font-semibold capitalize mb-2">{family.color}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{family.meaning}</p>
                  <div className="flex gap-2">
                    {family.seals.map((num) => {
                      const seal = SEALS.find(s => s.number === num)
                      return (
                        <span key={num} className="text-xs bg-white/5 px-2 py-1 rounded">
                          {seal?.english}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 13 Galactic Tones */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 13 Galactic Tones</h2>
            <p className="text-muted-foreground mb-6">
              The 13 Tones represent stages in a creative cycle, from initiation to transcendence.
            </p>

            <div className="space-y-2">
              {TONES.map((tone) => (
                <div
                  key={tone.number}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    {tone.number}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{tone.name}</div>
                    <div className="text-xs text-muted-foreground">{tone.nameHebrew}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tone.keywords?.slice(0, 2).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* The Oracle */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The Oracle</h2>
            <p className="text-muted-foreground mb-6">
              Each Kin has four associated energies that form the Oracle — a cosmic support system.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5">
                <h3 className="font-semibold text-amber-400 mb-2">Guide</h3>
                <p className="text-sm text-muted-foreground">
                  The higher wisdom that leads and inspires. Based on your tone and seal.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h3 className="font-semibold text-green-400 mb-2">Analog</h3>
                <p className="text-sm text-muted-foreground">
                  Your support energy — a complementary ally that works with your seal.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h3 className="font-semibold text-red-400 mb-2">Antipode</h3>
                <p className="text-sm text-muted-foreground">
                  The challenge and gift — opposite energy that creates balance and growth.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h3 className="font-semibold text-purple-400 mb-2">Occult</h3>
                <p className="text-sm text-muted-foreground">
                  Hidden power — the unexpected gifts that emerge from the shadows.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to discover your Galactic Signature?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/calculate">Calculate Your Kin</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/today">See Today&apos;s Kin</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
