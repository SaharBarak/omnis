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

    // Simulate a brief calculation delay for effect
    await new Promise(resolve => setTimeout(resolve, 800))

    // dateToKin expects a date string in YYYY-MM-DD format
    const kin = dateToKin(birthDate)
    const sealNumber = kinToSeal(kin)
    const toneNumber = kinToTone(kin)
    const seal = SEALS.find(s => s.number === sealNumber)!
    const tone = TONES.find(t => t.number === toneNumber)!
    // generateMantra expects full Seal and Tone objects
    const mantra = generateMantra(seal, tone)

    setResult({ kin, seal, tone, mantra })
    setIsCalculating(false)

    // Trigger reveal animation
    setTimeout(() => setIsRevealed(true), 100)
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5" id="demo">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Try It <span className="text-gold-gradient">Now</span>
          </h2>
          <p className="text-muted-foreground">
            Enter your birth date to see your Dreamspell Kin instantly.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* Input Form */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Label htmlFor="birthdate" className="sr-only">Birth Date</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12 text-base"
                placeholder="Select your birth date"
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={!birthDate || isCalculating}
              className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
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
                <>Calculate<span className="ml-2">-&gt;</span></>
              )}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <div className={`result-card ${isRevealed ? 'revealed' : ''}`}>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Your Dreamspell Kin
                </div>

                <div className="kin-number text-5xl mb-2">{result.kin}</div>

                <div className="text-2xl font-bold mb-4">
                  {result.tone.name} {result.seal.english}
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm seal-color-${result.seal.color}`}>
                    {result.seal.color} {result.seal.english}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-primary/20">
                    Tone {result.tone.number}
                  </span>
                </div>

                <p className="text-muted-foreground italic mb-6 max-w-md mx-auto">
                  &ldquo;{result.mantra}&rdquo;
                </p>

                <Button variant="outline" asChild>
                  <Link href="/login">
                    See Full Reading
                    <span className="ml-2">-&gt;</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .result-card {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .result-card.revealed {
          opacity: 1;
          transform: scale(1);
        }

        .seal-color-red { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .seal-color-white { background-color: rgba(248, 250, 252, 0.1); color: #f8fafc; }
        .seal-color-blue { background-color: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .seal-color-yellow { background-color: rgba(234, 179, 8, 0.2); color: #eab308; }
      `}</style>
    </section>
  )
}
