'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import Link from 'next/link'

interface DemoResult {
  kin: number
  seal: (typeof SEALS)[0]
  tone: (typeof TONES)[0]
  mantra: string
}

export function Demo() {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState<DemoResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  const handleCalculate = async () => {
    if (!birthDate) return

    setIsCalculating(true)
    setIsRevealed(false)

    await new Promise(resolve => setTimeout(resolve, 800))

    const kin = dateToKin(birthDate)
    const sealNumber = kinToSeal(kin)
    const toneNumber = kinToTone(kin)
    const seal = SEALS.find(s => s.number === sealNumber)!
    const tone = TONES.find(t => t.number === toneNumber)!
    const mantra = generateMantra(seal, tone)

    setResult({ kin, seal, tone, mantra })
    setIsCalculating(false)

    setTimeout(() => setIsRevealed(true), 100)
  }

  const getSealColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-seal-red text-white',
      white: 'bg-seal-white text-foreground border border-border',
      blue: 'bg-seal-blue text-white',
      yellow: 'bg-seal-yellow text-foreground',
    }
    return colors[color] || 'bg-primary text-primary-foreground'
  }

  return (
    <section className="py-20 lg:py-28 px-6 bg-muted/20" id="demo">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="earth-badge inline-flex mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>No signup needed. Try it now.</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading text-foreground mb-3">
            Calculate your <span className="text-earth-gradient">Kin</span>
          </h2>
          <p className="text-muted-foreground">
            Your Dreamspell galactic signature - the seal, tone, and affirmation for your birth date.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="earth-card bg-card">
          <div className="p-6 sm:p-8">
            {/* Input Form */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <Label htmlFor="birthdate" className="sr-only">Birth Date</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-12 text-base bg-background border-border text-foreground focus:border-primary focus:ring-primary/20 rounded-lg"
                />
              </div>
              <Button
                onClick={handleCalculate}
                disabled={!birthDate || isCalculating}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Calculating...
                  </span>
                ) : (
                  'Calculate'
                )}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="border-t border-border pt-6">
                  <div className="text-center">
                    {/* Label */}
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                      Your Galactic Signature
                    </div>

                    {/* Kin number */}
                    <div className="text-7xl font-heading text-primary mb-2">
                      {result.kin}
                    </div>

                    {/* Name */}
                    <div className="text-2xl font-heading text-foreground mb-2">
                      {result.tone.name} {result.seal.english}
                    </div>

                    {/* Mantra */}
                    <p className="text-muted-foreground italic mb-8 max-w-sm mx-auto">
                      &ldquo;{result.mantra}&rdquo;
                    </p>

                    {/* Data pills */}
                    <div className="flex justify-center flex-wrap gap-2 mb-8">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getSealColorClass(result.seal.color)}`}>
                        {result.seal.color} seal
                      </div>
                      <div className="px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground">
                        Tone {result.tone.number}
                      </div>
                      <div className="px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground">
                        Seal {result.seal.number}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-11 rounded-lg transition-colors"
                      asChild
                    >
                      <Link href="/login">
                        See Full Profile (Free)
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
