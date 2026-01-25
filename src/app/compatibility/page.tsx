'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header, Footer } from '@/components/landing'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'

interface PersonData {
  name: string
  birthDate: string
  kin?: number
  seal?: typeof SEALS[0]
  tone?: typeof TONES[0]
  oracle?: ReturnType<typeof calculateOracle>
}

interface CompatibilityResult {
  person1: PersonData
  person2: PersonData
  connections: Connection[]
  overallScore: number
  summary: string
}

interface Connection {
  type: string
  description: string
  strength: 'strong' | 'moderate' | 'subtle'
}

function calculateCompatibility(p1: PersonData, p2: PersonData): CompatibilityResult {
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
      description: `${p2.name} is ${p1.name}'s Analog — natural allies and support partners.`,
      strength: 'strong',
    })
    score += 15
  }
  if (p2.oracle.analog === p1.seal.number) {
    connections.push({
      type: 'Analog',
      description: `${p1.name} is ${p2.name}'s Analog — natural allies and support partners.`,
      strength: 'strong',
    })
    score += 15
  }

  // Antipode relationship
  if (p1.oracle.antipode === p2.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p2.name} is ${p1.name}'s Antipode — challenging but growth-inducing.`,
      strength: 'moderate',
    })
    score += 5
  }
  if (p2.oracle.antipode === p1.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p1.name} is ${p2.name}'s Antipode — challenging but growth-inducing.`,
      strength: 'moderate',
    })
    score += 5
  }

  // Occult relationship
  if (p1.oracle.occult === p2.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p2.name} is ${p1.name}'s Occult — hidden power and unexpected gifts.`,
      strength: 'strong',
    })
    score += 12
  }
  if (p2.oracle.occult === p1.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p1.name} is ${p2.name}'s Occult — hidden power and unexpected gifts.`,
      strength: 'strong',
    })
    score += 12
  }

  // Guide relationship
  if (p1.oracle.guide === p2.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p2.name} is ${p1.name}'s Guide — a natural mentor and inspiration.`,
      strength: 'strong',
    })
    score += 15
  }
  if (p2.oracle.guide === p1.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p1.name} is ${p2.name}'s Guide — a natural mentor and inspiration.`,
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
  if (score >= 80) {
    summary = `Strong cosmic alignment! ${p1.name} and ${p2.name} share powerful oracle connections that support growth and harmony.`
  } else if (score >= 60) {
    summary = `Good compatibility. ${p1.name} and ${p2.name} have meaningful connections that create balance and mutual benefit.`
  } else if (score >= 40) {
    summary = `Moderate connection. ${p1.name} and ${p2.name} bring different energies that can create interesting dynamics.`
  } else {
    summary = `Independent energies. ${p1.name} and ${p2.name} offer fresh perspectives to each other through their differences.`
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

      setResult(calculateCompatibility(p1Data, p2Data))
      setIsCalculating(false)
    }, 800)
  }

  const getSealColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      white: 'bg-slate-100/10 text-slate-200 border-slate-300/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    }
    return colors[color] || ''
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-gold-gradient">Compatibility</span> Check
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the Dreamspell oracle connections between two people.
              See how your galactic signatures relate and support each other.
            </p>
          </div>

          {/* Input Form */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Person 1 */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4">Person 1</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name1">Name (optional)</Label>
                  <Input
                    id="name1"
                    placeholder="Enter name"
                    value={person1.name}
                    onChange={(e) => setPerson1({ ...person1, name: e.target.value })}
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
                  />
                </div>
              </div>
            </div>

            {/* Person 2 */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4">Person 2</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name2">Name (optional)</Label>
                  <Input
                    id="name2"
                    placeholder="Enter name"
                    value={person2.name}
                    onChange={(e) => setPerson2({ ...person2, name: e.target.value })}
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Score */}
              <div className="glass rounded-xl p-8 text-center">
                <div className="kin-number text-6xl mb-4">{result.overallScore}%</div>
                <p className="text-lg text-muted-foreground">{result.summary}</p>
              </div>

              {/* Kin Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {[result.person1, result.person2].map((person, i) => (
                  <div key={i} className="hero-card p-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      {person.name || `Person ${i + 1}`}
                    </div>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border ${getSealColorClass(person.seal?.color || '')}`}>
                      <span className="text-lg font-bold">{person.seal?.number}</span>
                    </div>
                    <div className="kin-number text-3xl mb-1">{person.kin}</div>
                    <div className="font-semibold">
                      {person.tone?.name} {person.seal?.english}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {person.seal?.hebrew} {person.tone?.nameHebrew}
                    </div>
                  </div>
                ))}
              </div>

              {/* Connections */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Oracle Connections</h3>
                <div className="space-y-3">
                  {result.connections.map((connection, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border ${getStrengthColor(connection.strength)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{connection.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 capitalize">
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
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
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
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">How Oracle Compatibility Works</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  In the Dreamspell system, each person has an <strong className="text-foreground">oracle</strong> —
                  four seals that relate to their galactic signature in specific ways:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-white/5">
                    <strong className="text-amber-400">Guide</strong>: Natural mentor, leads and inspires
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <strong className="text-green-400">Analog</strong>: Support partner, complementary ally
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <strong className="text-red-400">Antipode</strong>: Challenge and gift, creates balance
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <strong className="text-purple-400">Occult</strong>: Hidden power, unexpected gifts
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
