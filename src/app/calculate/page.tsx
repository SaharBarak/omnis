'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { Header, Footer } from '@/components/landing'
import { getSealGlyphPath, getToneGlyphPath, getSmallSealGlyphPath } from '@/lib/dreamspell-assets'

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

interface CalculationResult {
  kin: number
  seal: (typeof SEALS)[0]
  tone: (typeof TONES)[0]
  mantra: string
  oracle: {
    guide: (typeof SEALS)[0]
    analog: (typeof SEALS)[0]
    antipode: (typeof SEALS)[0]
    occult: (typeof SEALS)[0]
  }
}

export default function CalculatePage() {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    if (!birthDate) return

    setIsCalculating(true)

    // Brief delay for effect
    await new Promise(resolve => setTimeout(resolve, 500))

    const kin = dateToKin(birthDate)
    const sealNumber = kinToSeal(kin)
    const toneNumber = kinToTone(kin)
    const seal = SEALS.find(s => s.number === sealNumber)!
    const tone = TONES.find(t => t.number === toneNumber)!
    const mantra = generateMantra(seal, tone)
    const oracleResult = calculateOracle(kin)

    setResult({
      kin,
      seal,
      tone,
      mantra,
      oracle: {
        guide: getOracleSeal(oracleResult.guide),
        analog: getOracleSeal(oracleResult.analog),
        antipode: getOracleSeal(oracleResult.antipode),
        occult: getOracleSeal(oracleResult.occult),
      },
    })

    setIsCalculating(false)
  }

  const handleReset = () => {
    setBirthDate('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="earth-badge inline-flex mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Free Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">
              Dreamspell Kin <span className="text-earth-gradient">Calculator</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enter any birth date to discover the Dreamspell galactic signature.
              Free, instant, and accurate calculations.
            </p>
          </div>

          {/* Calculator Form */}
          <div className="earth-card bg-card p-6 sm:p-8 mb-8">
            {!result ? (
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="birthdate" className="text-sm font-medium mb-2 block">
                      Birth Date
                    </Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-12 text-base bg-background border-border"
                    />
                  </div>

                  <Button
                    onClick={handleCalculate}
                    disabled={!birthDate || isCalculating}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {isCalculating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      'Calculate Kin'
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Calculations use the Jos&eacute; Arg&uuml;elles Dreamspell system (1987)
                  with leap-day correction.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Result Header */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Birth Date: {new Date(birthDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {/* Seal + Tone Glyphs */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <img
                      src={getSealGlyphPath(result.seal.number)}
                      alt={result.seal.english}
                      className="w-20 h-20 object-contain"
                    />
                    <img
                      src={getToneGlyphPath(result.tone.number)}
                      alt={`Tone ${result.tone.number}`}
                      className="w-14 h-14 object-contain"
                    />
                  </div>

                  {/* Kin Number & Name */}
                  <div className="text-5xl font-heading text-primary mb-2">{result.kin}</div>
                  <h2 className="text-3xl font-heading text-foreground mb-1">
                    {result.tone.name} {result.seal.english}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {result.seal.hebrew} {result.tone.nameHebrew}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getSealColorClass(result.seal.color)}`}>
                      {result.seal.color.charAt(0).toUpperCase() + result.seal.color.slice(1)} {result.seal.english}
                    </span>
                    <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                      Tone {result.tone.number}: {result.tone.name}
                    </span>
                  </div>

                  {/* Mantra */}
                  <div className="max-w-md mx-auto">
                    <p className="text-lg italic text-muted-foreground whitespace-pre-line">
                      &ldquo;{result.mantra}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Oracle */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-heading text-center mb-4">Oracle Map</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Guide', seal: result.oracle.guide },
                      { label: 'Analog', seal: result.oracle.analog },
                      { label: 'Antipode', seal: result.oracle.antipode },
                      { label: 'Occult', seal: result.oracle.occult },
                    ].map(({ label, seal }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-muted/50">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
                        <img
                          src={getSmallSealGlyphPath(seal.number)}
                          alt={seal.english}
                          className="w-10 h-10 mx-auto mb-1 object-contain"
                        />
                        <div className="font-medium text-sm">{seal.english}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={handleReset}>
                    Calculate Another
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    asChild
                  >
                    <Link href="/login">
                      Save This Reading
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="earth-card bg-card p-6">
            <h3 className="text-lg font-heading mb-4">About Dreamspell</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Dreamspell is a calendar system created by Jos&eacute; Arg&uuml;elles in 1987, inspired
                by the Mayan calendar. It assigns a unique &ldquo;galactic signature&rdquo; to each day
                based on 20 solar seals and 13 galactic tones.
              </p>
              <p>
                Your birth kin represents your core energy and purpose. The oracle map shows
                four related seals that influence and support your journey.
              </p>
              <p>
                <Link href="/learn/dreamspell" className="text-primary hover:underline">
                  Learn more about the Dreamspell system &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
