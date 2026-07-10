'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header, Footer } from '@/components/landing'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import {
  calculateFiveSystemCompatibility,
  getScoreColor,
  type CompatSystem,
} from '@pleiad/engine/services/compatibility'

interface PersonData {
  name: string
  birthDate: string
  hebrewName?: string
  kin?: number
  seal?: typeof SEALS[0]
  tone?: typeof TONES[0]
  oracle?: ReturnType<typeof calculateOracle>
}

interface SystemBreakdown {
  key: CompatSystem
  label: string
  labelHebrew: string
  score: number
  available: boolean
}

const SYSTEM_LABELS: Record<CompatSystem, { en: string; he: string }> = {
  dreamspell: { en: 'Dreamspell', he: 'דרימספל' },
  tzolkin: { en: 'Tzolkin', he: 'צולקין' },
  astrology: { en: 'Astrology', he: 'אסטרולוגיה' },
  humanDesign: { en: 'Human Design', he: 'עיצוב אנושי' },
  gematria: { en: 'Gematria', he: 'גימטריה' },
}

interface CompatibilityResult {
  person1: PersonData
  person2: PersonData
  connections: Connection[]
  overallScore: number
  summary: string
  systems: SystemBreakdown[]
  availableCount: number
}

interface Connection {
  type: string
  description: string
  strength: 'strong' | 'moderate' | 'subtle'
}

function calculateCompatibility(
  p1: PersonData,
  p2: PersonData
): Omit<CompatibilityResult, 'systems' | 'availableCount'> {
  const connections: Connection[] = []
  let score = 50 // Base compatibility

  if (!p1.seal || !p2.seal || !p1.oracle || !p2.oracle || !p1.tone || !p2.tone) {
    return {
      person1: p1,
      person2: p2,
      connections: [],
      overallScore: 0,
      summary: 'Unable to calculate compatibility.',
    }
  }

  // Same seal
  if (p1.seal.number === p2.seal.number) {
    connections.push({
      type: 'Same Seal',
      description: `Both are ${p1.seal.english}! You share the same archetypal energy.`,
      strength: 'strong',
    })
    score += 20
  }

  // Analog relationship
  if (p1.oracle.analog === p2.seal.number) {
    connections.push({
      type: 'Analog',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Analog — natural allies and support partners.`,
      strength: 'strong',
    })
    score += 15
  }
  if (p2.oracle.analog === p1.seal.number) {
    connections.push({
      type: 'Analog',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Analog — natural allies and support partners.`,
      strength: 'strong',
    })
    score += 15
  }

  // Antipode relationship
  if (p1.oracle.antipode === p2.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Antipode — challenging but growth-inducing.`,
      strength: 'moderate',
    })
    score += 5
  }
  if (p2.oracle.antipode === p1.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Antipode — challenging but growth-inducing.`,
      strength: 'moderate',
    })
    score += 5
  }

  // Occult relationship
  if (p1.oracle.occult === p2.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Occult — hidden power and unexpected gifts.`,
      strength: 'strong',
    })
    score += 12
  }
  if (p2.oracle.occult === p1.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Occult — hidden power and unexpected gifts.`,
      strength: 'strong',
    })
    score += 12
  }

  // Guide relationship
  if (p1.oracle.guide === p2.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Guide — a natural mentor and inspiration.`,
      strength: 'strong',
    })
    score += 15
  }
  if (p2.oracle.guide === p1.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Guide — a natural mentor and inspiration.`,
      strength: 'strong',
    })
    score += 15
  }

  // Same color family
  if (p1.seal.color === p2.seal.color) {
    connections.push({
      type: 'Color Family',
      description: `Both are ${p1.seal.color} energy — similar rhythm and approach to life.`,
      strength: 'moderate',
    })
    score += 8
  }

  // Same tone
  if (p1.tone.number === p2.tone.number) {
    connections.push({
      type: 'Same Tone',
      description: `Both carry Tone ${p1.tone.number} (${p1.tone.name}) — similar creative pulse.`,
      strength: 'moderate',
    })
    score += 10
  }

  // No connections found
  if (connections.length === 0) {
    connections.push({
      type: 'Independent',
      description: 'No direct oracle connections — unique perspectives that complement through difference.',
      strength: 'subtle',
    })
  }

  // Cap score
  score = Math.min(100, score)

  // Generate summary
  let summary = ''
  const name1 = p1.name || 'Person 1'
  const name2 = p2.name || 'Person 2'
  if (score >= 80) {
    summary = `Strong cosmic alignment! ${name1} and ${name2} share powerful oracle connections that support growth and harmony.`
  } else if (score >= 60) {
    summary = `Good compatibility. ${name1} and ${name2} have meaningful connections that create balance and mutual benefit.`
  } else if (score >= 40) {
    summary = `Moderate connection. ${name1} and ${name2} bring different energies that can create interesting dynamics.`
  } else {
    summary = `Independent energies. ${name1} and ${name2} offer fresh perspectives to each other through their differences.`
  }

  return {
    person1: p1,
    person2: p2,
    connections,
    overallScore: score,
    summary,
  }
}

export default function CompatibilityPage() {
  const [person1, setPerson1] = useState<PersonData>({ name: '', birthDate: '' })
  const [person2, setPerson2] = useState<PersonData>({ name: '', birthDate: '' })
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateResults = () => {
    if (!person1.birthDate || !person2.birthDate) return

    setIsCalculating(true)

    // Simulate calculation delay for UX
    setTimeout(() => {
      const kin1 = dateToKin(person1.birthDate)
      const seal1 = SEALS.find(s => s.number === kinToSeal(kin1))!
      const tone1 = TONES.find(t => t.number === kinToTone(kin1))!
      const oracle1 = calculateOracle(kin1)

      const kin2 = dateToKin(person2.birthDate)
      const seal2 = SEALS.find(s => s.number === kinToSeal(kin2))!
      const tone2 = TONES.find(t => t.number === kinToTone(kin2))!
      const oracle2 = calculateOracle(kin2)

      const p1Data = { ...person1, kin: kin1, seal: seal1, tone: tone1, oracle: oracle1 }
      const p2Data = { ...person2, kin: kin2, seal: seal2, tone: tone2, oracle: oracle2 }

      const base = calculateCompatibility(p1Data, p2Data)

      // Five-system fusion (date-only -> Dreamspell+Tzolkin+Astrology;
      // + Hebrew names -> Gematria). Overrides the score/summary with the blend.
      const fusion = calculateFiveSystemCompatibility(
        { birthDate: person1.birthDate, hebrewName: person1.hebrewName, name: person1.name },
        { birthDate: person2.birthDate, hebrewName: person2.hebrewName, name: person2.name }
      )

      const systems: SystemBreakdown[] = (
        Object.keys(fusion.systems) as CompatSystem[]
      ).map((key) => ({
        key,
        label: SYSTEM_LABELS[key].en,
        labelHebrew: SYSTEM_LABELS[key].he,
        score: fusion.systems[key].score,
        available: fusion.systems[key].available,
      }))

      setResult({
        ...base,
        overallScore: fusion.overallScore,
        summary: fusion.summary.english,
        systems,
        availableCount: fusion.availableSystems.length,
      })
      setIsCalculating(false)
    }, 800)
  }

  const getSealColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-seal-red/15 text-seal-red border-seal-red/30',
      white: 'bg-seal-white text-foreground border-border',
      blue: 'bg-seal-blue/15 text-seal-blue border-seal-blue/30',
      yellow: 'bg-seal-yellow/15 text-seal-yellow border-seal-yellow/30',
    }
    return colors[color] || ''
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-secondary/15 text-secondary border-secondary/30'
      case 'moderate': return 'bg-amber/15 text-amber border-amber/30'
      default: return 'bg-accent/15 text-accent border-accent/30'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="earth-badge inline-flex mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Oracle Relationships</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">
              <span className="text-earth-gradient">Compatibility</span> Check
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the connection between two people across five wisdom systems —
              Dreamspell, Tzolkin, Astrology, Human Design, and Gematria. Add Hebrew
              names for gematria resonance.
            </p>
          </div>

          {/* Input Form */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Person 1 */}
            <div className="earth-card bg-card p-6">
              <h3 className="font-heading text-lg mb-4">Person 1</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name1">Name (optional)</Label>
                  <Input
                    id="name1"
                    placeholder="Enter name"
                    value={person1.name}
                    onChange={(e) => setPerson1({ ...person1, name: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="birth1">Birth Date *</Label>
                  <Input
                    id="birth1"
                    type="date"
                    value={person1.birthDate}
                    onChange={(e) => setPerson1({ ...person1, birthDate: e.target.value })}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="hebrew1">Hebrew Name (optional)</Label>
                  <Input
                    id="hebrew1"
                    placeholder="לשם תאימות גימטריה"
                    dir="rtl"
                    value={person1.hebrewName || ''}
                    onChange={(e) => setPerson1({ ...person1, hebrewName: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>

            {/* Person 2 */}
            <div className="earth-card bg-card p-6">
              <h3 className="font-heading text-lg mb-4">Person 2</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name2">Name (optional)</Label>
                  <Input
                    id="name2"
                    placeholder="Enter name"
                    value={person2.name}
                    onChange={(e) => setPerson2({ ...person2, name: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="birth2">Birth Date *</Label>
                  <Input
                    id="birth2"
                    type="date"
                    value={person2.birthDate}
                    onChange={(e) => setPerson2({ ...person2, birthDate: e.target.value })}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="hebrew2">Hebrew Name (optional)</Label>
                  <Input
                    id="hebrew2"
                    placeholder="לשם תאימות גימטריה"
                    dir="rtl"
                    value={person2.hebrewName || ''}
                    onChange={(e) => setPerson2({ ...person2, hebrewName: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="text-center mb-8">
            <Button
              size="lg"
              onClick={calculateResults}
              disabled={!person1.birthDate || !person2.birthDate || isCalculating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCalculating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Calculating...
                </>
              ) : (
                'Check Compatibility'
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-fade-up">
              {/* Score */}
              <div className="earth-card bg-card p-8 text-center">
                <div
                  className="text-6xl font-heading mb-4"
                  style={{ color: getScoreColor(result.overallScore) }}
                >
                  {result.overallScore}%
                </div>
                <p className="text-lg text-muted-foreground">{result.summary}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Blended across {result.availableCount} of 5 wisdom systems
                </p>
              </div>

              {/* System Breakdown */}
              <div className="earth-card bg-card p-6">
                <h3 className="text-xl font-heading mb-4">System Breakdown</h3>
                <div className="space-y-3">
                  {result.systems.map((sys) => (
                    <div key={sys.key} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-sm">
                        <span className="text-foreground">{sys.label}</span>
                        <span className="text-muted-foreground"> · {sys.labelHebrew}</span>
                      </div>
                      {sys.available ? (
                        <>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${sys.score}%`,
                                backgroundColor: getScoreColor(sys.score),
                              }}
                            />
                          </div>
                          <div className="w-10 shrink-0 text-right text-sm font-medium">
                            {sys.score}%
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 text-xs text-muted-foreground italic">
                          {sys.key === 'humanDesign'
                            ? 'Add birth time + place'
                            : sys.key === 'gematria'
                              ? 'Add Hebrew names'
                              : 'Not available'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kin Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {[result.person1, result.person2].map((person, i) => (
                  <div key={i} className="earth-card bg-card p-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      {person.name || `Person ${i + 1}`}
                    </div>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border ${getSealColorClass(person.seal?.color || '')}`}>
                      <span className="text-lg font-medium">{person.seal?.number}</span>
                    </div>
                    <div className="text-3xl font-heading text-primary mb-1">{person.kin}</div>
                    <div className="font-heading">
                      {person.tone?.name} {person.seal?.english}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {person.seal?.hebrew} {person.tone?.nameHebrew}
                    </div>
                  </div>
                ))}
              </div>

              {/* Connections */}
              <div className="earth-card bg-card p-6">
                <h3 className="text-xl font-heading mb-4">Oracle Connections</h3>
                <div className="space-y-3">
                  {result.connections.map((connection, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${getStrengthColor(connection.strength)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{connection.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                          {connection.strength}
                        </span>
                      </div>
                      <p className="text-sm">{connection.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <p className="text-muted-foreground mb-4">
                  Want to track relationships and explore deeper connections?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                    <Link href="/login">Create Free Account</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/learn/dreamspell">Learn About Oracle</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* How It Works */}
          {!result && (
            <div className="earth-card bg-card p-6">
              <h3 className="text-xl font-heading mb-4">How Oracle Compatibility Works</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  In the Dreamspell system, each person has an <strong className="text-foreground">oracle</strong> —
                  four seals that relate to their galactic signature in specific ways:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <strong className="text-amber">Guide</strong>: Natural mentor, leads and inspires
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <strong className="text-secondary">Analog</strong>: Support partner, complementary ally
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <strong className="text-seal-red">Antipode</strong>: Challenge and gift, creates balance
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <strong className="text-accent">Occult</strong>: Hidden power, unexpected gifts
                  </div>
                </div>
                <p>
                  When someone&apos;s seal appears in your oracle (or vice versa), you have a cosmic connection
                  that influences how you interact and support each other&apos;s growth.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
