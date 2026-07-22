'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import {
  calculateFiveSystemCompatibility,
  type CompatSystem,
} from '@pleiad/engine/services/compatibility'
import { NavV2, FooterV2, StarParallax, MuralBackdrop } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import { MURAL_GROUND, scoreColor } from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/ui/date-field'
import { Button } from '@/components/ui/button'

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

// Names the Dreamspell oracle ties between two people. Scoring and the
// summary line come from the five-system fusion engine — this helper only
// contributes the named connections.
function findOracleConnections(p1: PersonData, p2: PersonData): Connection[] {
  const connections: Connection[] = []

  if (!p1.seal || !p2.seal || !p1.oracle || !p2.oracle || !p1.tone || !p2.tone) {
    return connections
  }

  // Same seal
  if (p1.seal.number === p2.seal.number) {
    connections.push({
      type: 'Same Seal',
      description: `Both are ${p1.seal.english}! You share the same archetypal energy.`,
      strength: 'strong',
    })
  }

  // Analog relationship
  if (p1.oracle.analog === p2.seal.number) {
    connections.push({
      type: 'Analog',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Analog, natural allies and support partners.`,
      strength: 'strong',
    })
  }
  if (p2.oracle.analog === p1.seal.number) {
    connections.push({
      type: 'Analog',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Analog, natural allies and support partners.`,
      strength: 'strong',
    })
  }

  // Antipode relationship
  if (p1.oracle.antipode === p2.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Antipode, challenging but growth-inducing.`,
      strength: 'moderate',
    })
  }
  if (p2.oracle.antipode === p1.seal.number) {
    connections.push({
      type: 'Antipode',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Antipode, challenging but growth-inducing.`,
      strength: 'moderate',
    })
  }

  // Occult relationship
  if (p1.oracle.occult === p2.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Occult, hidden power and unexpected gifts.`,
      strength: 'strong',
    })
  }
  if (p2.oracle.occult === p1.seal.number) {
    connections.push({
      type: 'Occult',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Occult, hidden power and unexpected gifts.`,
      strength: 'strong',
    })
  }

  // Guide relationship
  if (p1.oracle.guide === p2.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p2.name || 'Person 2'} is ${p1.name || 'Person 1'}'s Guide, a natural mentor and inspiration.`,
      strength: 'strong',
    })
  }
  if (p2.oracle.guide === p1.seal.number) {
    connections.push({
      type: 'Guide',
      description: `${p1.name || 'Person 1'} is ${p2.name || 'Person 2'}'s Guide, a natural mentor and inspiration.`,
      strength: 'strong',
    })
  }

  // Same color family
  if (p1.seal.color === p2.seal.color) {
    connections.push({
      type: 'Color Family',
      description: `Both are ${p1.seal.color} energy, similar rhythm and approach to life.`,
      strength: 'moderate',
    })
  }

  // Same tone
  if (p1.tone.number === p2.tone.number) {
    connections.push({
      type: 'Same Tone',
      description: `Both carry Tone ${p1.tone.number} (${p1.tone.name}), similar creative pulse.`,
      strength: 'moderate',
    })
  }

  // No connections found
  if (connections.length === 0) {
    connections.push({
      type: 'Independent',
      description: 'No direct oracle connections, unique perspectives that complement through difference.',
      strength: 'subtle',
    })
  }

  return connections
}

const inputClass =
  'bg-white/[0.04] border-white/15 text-white placeholder:text-white/30'

export default function CompatibilityPage() {
  const [person1, setPerson1] = useState<PersonData>({ name: '', birthDate: '' })
  const [person2, setPerson2] = useState<PersonData>({ name: '', birthDate: '' })
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Computed after mount: timezone/ICU-dependent — SSR rendering it
  // guarantees hydration text mismatches for most of the day.
  const [liveLine, setLiveLine] = useState('')
  useEffect(() => {
    setLiveLine(getFooterLiveLine(getTodayAcrossSystems()))
  }, [])

  const calculateResults = () => {
    if (!person1.birthDate || !person2.birthDate) {
      setFormError('Enter both birth dates first.')
      return
    }
    setFormError(null)

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

      const connections = findOracleConnections(p1Data, p2Data)

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
        person1: p1Data,
        person2: p2Data,
        connections,
        overallScore: fusion.overallScore,
        summary: fusion.summary.english,
        systems,
        availableCount: fusion.availableSystems.length,
      })
      setIsCalculating(false)
    }, 800)
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* The thread of light running down between the two people — the
            connection this page measures, drawn before it's calculated. */}
        <MuralBackdrop
          placement="center-vein"
          src="/images/redesign/motifs/thread-of-light.webp"
          blend
          opacity={0.5}
        />

        <div className="relative mx-auto max-w-3xl px-6">
          {/* Hero */}
          <div className="mb-12 text-center">
            <p className={`${TYPE.eyebrow} text-brand`}>Oracle Relationships</p>
            <h1 className={`${TYPE.hero} mx-auto mt-4`}>
              Compatibility Check
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Discover the connection between two people across five wisdom systems:
              Dreamspell, Tzolkin, Astrology, Human Design, and Kabbalah.
              Add Hebrew names for the Kabbalah layer.
            </p>
          </div>

          {/* Input Form */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {([
              { title: 'Person 1', person: person1, setPerson: setPerson1, suffix: '1' },
              { title: 'Person 2', person: person2, setPerson: setPerson2, suffix: '2' },
            ] as const).map(({ title, person, setPerson, suffix }) => (
              <div key={suffix} className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
                <h3 className={`${TYPE.h3} mb-4`}>{title}</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`name${suffix}`} className="text-white/70">Name (optional)</Label>
                    <Input
                      id={`name${suffix}`}
                      placeholder="Enter name"
                      value={person.name}
                      onChange={(e) => setPerson({ ...person, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`birth${suffix}`} className="text-white/70">Birth Date *</Label>
                    <DateField
                      id={`birth${suffix}`}
                      label={`${title} birth date`}
                      value={person.birthDate}
                      onChange={(birthDate) => setPerson({ ...person, birthDate })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`hebrew${suffix}`} className="text-white/70">Hebrew Name (optional)</Label>
                    <Input
                      id={`hebrew${suffix}`}
                      placeholder="לשם תאימות גימטריה"
                      dir="rtl"
                      value={person.hebrewName || ''}
                      onChange={(e) => setPerson({ ...person, hebrewName: e.target.value })}
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-white/40">
                      Hebrew name (used for the Gematria layer)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculate Button */}
          <div className="mb-8">
            <Button
              size="lg"
              onClick={calculateResults}
              disabled={isCalculating}
              className="h-12 w-full rounded-xl bg-brand font-medium text-white hover:bg-brand-soft active:scale-[0.98]"
            >
              {isCalculating ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Calculating...
                </span>
              ) : (
                'Check compatibility'
              )}
            </Button>
            {formError && (
              <p className="mt-3 text-center text-sm text-red-400/90">{formError}</p>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-fade-up">
              {/* Score */}
              <div className="rounded-2xl border border-white/10 bg-surface p-6 text-center md:p-8">
                <div
                  className="mb-4 font-display text-6xl font-semibold"
                  style={{ color: scoreColor(result.overallScore) }}
                >
                  {result.overallScore}%
                </div>
                <p className="text-lg leading-relaxed text-white/70">{result.summary}</p>
                <p className="mt-3 text-xs text-white/50">
                  Blended across {result.availableCount} of 5 wisdom systems
                </p>
              </div>

              {/* System Breakdown */}
              <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
                <h3 className={`${TYPE.h3} mb-4`}>System Breakdown</h3>
                <div className="space-y-3">
                  {result.systems.map((sys) => (
                    <div key={sys.key} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-sm">
                        <span className="text-white/90">{sys.label}</span>
                        <span className="text-white/50"> · {sys.labelHebrew}</span>
                      </div>
                      {sys.available ? (
                        <>
                          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${sys.score}%`,
                                backgroundColor: scoreColor(sys.score),
                              }}
                            />
                          </div>
                          <div className="w-10 shrink-0 text-right text-sm font-medium text-white/90">
                            {sys.score}%
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 text-xs italic text-white/40">
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
                  <div key={i} className="rounded-2xl border border-white/10 bg-surface p-6 text-center">
                    <div className="mb-2 text-sm text-white/50">
                      {person.name || `Person ${i + 1}`}
                    </div>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
                      <span className="text-lg font-medium text-white/80">{person.seal?.number}</span>
                    </div>
                    <div className="mb-1 font-display text-3xl text-brand-soft">{person.kin}</div>
                    <div className="font-display text-white">
                      {person.tone?.name} {person.seal?.english}
                    </div>
                    <div className="text-sm text-white/50">
                      {person.seal?.hebrew} {person.tone?.nameHebrew}
                    </div>
                  </div>
                ))}
              </div>

              {/* Connections */}
              <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
                <h3 className={`${TYPE.h3} mb-4`}>Oracle Connections</h3>
                <div className="space-y-3">
                  {result.connections.map((connection, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white/90">{connection.type}</span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs capitalize text-white/50">
                          {connection.strength}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{connection.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <p className="mb-4 text-white/70">
                  Want to track relationships and explore deeper connections?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    size="lg"
                    className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
                    asChild
                  >
                    <Link href="/login">Create a free account</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-white/15 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white"
                    asChild
                  >
                    <Link href="/learn/dreamspell">Learn about the oracle</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* How It Works */}
          {!result && (
            <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
              <h3 className={`${TYPE.h3} mb-4`}>How Oracle Compatibility Works</h3>
              <div className="space-y-4 text-white/50">
                <p>
                  In the Dreamspell system, each person has an <strong className="font-medium text-white/90">oracle</strong>,
                  four seals that relate to their galactic signature in specific ways:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { term: 'Guide', text: 'Natural mentor, leads and inspires' },
                    { term: 'Analog', text: 'Support partner, complementary ally' },
                    { term: 'Antipode', text: 'Challenge and gift, creates balance' },
                    { term: 'Occult', text: 'Hidden power, unexpected gifts' },
                  ].map(({ term, text }) => (
                    <div key={term} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <strong className="font-medium text-brand-soft">{term}</strong>: {text}
                    </div>
                  ))}
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

      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
