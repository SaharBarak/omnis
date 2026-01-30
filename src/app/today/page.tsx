import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: "Today's Kin - Daily Dreamspell Reading | Omnis",
  description: "Discover today's Dreamspell Kin, mantra, and oracle. Start your day with cosmic guidance. Free daily Dreamspell readings.",
  keywords: "dreamspell, kin of the day, today's kin, daily dreamspell, galactic signature",
}

// Revalidate every hour to update the kin
export const revalidate = 3600

function getSealColorClass(color: string): string {
  const colors: Record<string, string> = {
    red: 'bg-seal-red/15 text-seal-red border-seal-red/30',
    white: 'bg-seal-white text-foreground border-border',
    blue: 'bg-seal-blue/15 text-seal-blue border-seal-blue/30',
    yellow: 'bg-seal-yellow/15 text-seal-yellow border-seal-yellow/30',
  }
  return colors[color] || ''
}

function getOracleSeal(sealNumber: number) {
  return SEALS.find(s => s.number === sealNumber)!
}

export default function TodayPage() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  // Calculate today's kin
  const kin = dateToKin(dateStr)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = SEALS.find(s => s.number === sealNumber)!
  const tone = TONES.find(t => t.number === toneNumber)!
  const mantra = generateMantra(seal, tone)
  const oracle = calculateOracle(kin)

  // Get oracle seals
  const guideSeal = getOracleSeal(oracle.guide)
  const analogSeal = getOracleSeal(oracle.analog)
  const antipodeSeal = getOracleSeal(oracle.antipode)
  const occultSeal = getOracleSeal(oracle.occult)

  // Format date for display
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Date Header */}
          <div className="text-center mb-8">
            <div className="earth-badge inline-flex mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Today&apos;s Dreamspell Kin</span>
            </div>
            <h1 className="text-2xl font-heading text-foreground">{formattedDate}</h1>
          </div>

          {/* Main Kin Card */}
          <div className="earth-card bg-card p-8 mb-8">
            <div className="text-center">
              {/* Seal Icon */}
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border-2 ${getSealColorClass(seal.color)}`}>
                <img
                  src={`/icons/dreamspell/seals/${seal.number.toString().padStart(2, '0')}-${seal.english.toLowerCase()}.svg`}
                  alt={seal.english}
                  className="w-12 h-12"
                />
              </div>

              {/* Kin Number & Name */}
              <div className="text-6xl font-heading text-primary mb-2">{kin}</div>
              <h2 className="text-3xl font-heading text-foreground mb-1">
                {tone.name} {seal.english}
              </h2>
              <p className="text-muted-foreground mb-6">
                {seal.hebrew} {tone.nameHebrew}
              </p>

              {/* Badges */}
              <div className="flex justify-center gap-3 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getSealColorClass(seal.color)}`}>
                  {seal.color.charAt(0).toUpperCase() + seal.color.slice(1)} {seal.english}
                </span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  Tone {tone.number}: {tone.name}
                </span>
              </div>

              {/* Mantra */}
              <div className="max-w-md mx-auto">
                <p className="text-lg italic text-muted-foreground whitespace-pre-line">
                  &ldquo;{mantra}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Oracle Section */}
          <div className="earth-card bg-card p-6 mb-8">
            <h3 className="text-xl font-heading text-center mb-6">Today&apos;s Oracle</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Guide */}
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Guide</div>
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${getSealColorClass(guideSeal.color)}`}>
                  <span className="text-sm font-medium">{guideSeal.number}</span>
                </div>
                <div className="font-medium text-sm">{guideSeal.english}</div>
                <div className="text-xs text-muted-foreground">{guideSeal.hebrew}</div>
              </div>

              {/* Analog */}
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Analog</div>
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${getSealColorClass(analogSeal.color)}`}>
                  <span className="text-sm font-medium">{analogSeal.number}</span>
                </div>
                <div className="font-medium text-sm">{analogSeal.english}</div>
                <div className="text-xs text-muted-foreground">{analogSeal.hebrew}</div>
              </div>

              {/* Antipode */}
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Antipode</div>
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${getSealColorClass(antipodeSeal.color)}`}>
                  <span className="text-sm font-medium">{antipodeSeal.number}</span>
                </div>
                <div className="font-medium text-sm">{antipodeSeal.english}</div>
                <div className="text-xs text-muted-foreground">{antipodeSeal.hebrew}</div>
              </div>

              {/* Occult */}
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Occult</div>
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${getSealColorClass(occultSeal.color)}`}>
                  <span className="text-sm font-medium">{occultSeal.number}</span>
                </div>
                <div className="font-medium text-sm">{occultSeal.english}</div>
                <div className="text-xs text-muted-foreground">{occultSeal.hebrew}</div>
              </div>
            </div>
          </div>

          {/* Interpretation Section */}
          <div className="earth-card bg-card p-6 mb-8">
            <h3 className="text-xl font-heading mb-4">What Does This Mean?</h3>

            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">{tone.name} (Tone {tone.number})</strong> days
                are about {tone.keywords?.join(', ').toLowerCase() || tone.name.toLowerCase()}. The {tone.name} tone
                invites you to {tone.action?.toLowerCase() || 'align with'} the energy of the day.
              </p>

              <p>
                <strong className="text-foreground">{seal.english}</strong> ({seal.mayan}) represents
                the power of {seal.english.toLowerCase()}. This archetype works with the energy
                of transformation and {seal.english.toLowerCase()} consciousness.
              </p>

              <p>
                Today&apos;s <strong className="text-foreground">{seal.color}</strong> color family
                indicates this is a day focused on{' '}
                {seal.color === 'red' && 'initiating and birthing new energy'}
                {seal.color === 'white' && 'refining and purifying'}
                {seal.color === 'blue' && 'transforming and transmitting'}
                {seal.color === 'yellow' && 'ripening and maturing'}.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Want to know <strong className="text-foreground">your</strong> personal kin?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/calculate">Calculate Your Kin</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
