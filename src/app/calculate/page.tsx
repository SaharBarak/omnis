'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { getSunSign } from '@pleiad/engine/calculations/astrology'
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'
import { dateToLongCount, formatLongCount } from '@pleiad/engine/calculations/long-count'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { generateMantra } from '@pleiad/engine/data/mantras'
import type { ZodiacSign } from '@pleiad/engine/types/astrology'
import type { TzolkinDay } from '@pleiad/engine/types/tzolkin'
import { track } from '@/lib/analytics/posthog'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Button } from '@/components/ui/button'
import { NavV2, FooterV2, StarParallax, MuralBackdrop } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import {
  MURAL_GROUND,
  SYSTEM_FLAVORS,
  INTEGRATION_FLAVOR,
} from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import { getSealGlyphPath, getToneGlyphPath, getSmallSealGlyphPath } from '@/lib/dreamspell-assets'

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
  /** Date-only hooks for the locked system teasers. */
  sunSign: ZodiacSign
  tzolkin: TzolkinDay
  longCount: string
}

interface LockedFlavor {
  readonly name: string
  readonly accent: string
  readonly accentSoft: string
}

/**
 * One locked teaser per system the funnel promises. Same layout grammar as
 * the unlocked Dreamspell card; the flavor accent is the only skin change
 * (mirrors how /learn and the homepage mural color-code the systems).
 */
function LockedSection({
  flavor,
  unlockNote,
  teaser,
  children,
}: {
  readonly flavor: LockedFlavor
  readonly unlockNote: string
  readonly teaser: string
  readonly children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${flavor.accent}66 50%, transparent)`,
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span
          className={`${TYPE.eyebrow} inline-flex items-center gap-2`}
          style={{ color: flavor.accentSoft }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: flavor.accent }}
          />
          {flavor.name}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          {unlockNote}
        </span>
      </div>

      {children}

      <p className="mt-4 text-sm leading-relaxed text-white/50">{teaser}</p>

      <Link
        href="/pricing"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-transform duration-300 hover:translate-x-1"
        style={{ color: flavor.accentSoft }}
      >
        See access options
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </section>
  )
}

export default function CalculatePage() {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Computed after mount: the line depends on the viewer's timezone and the
  // runtime's ICU — rendering it during SSR guarantees hydration mismatches.
  const [liveLine, setLiveLine] = useState('')
  useEffect(() => {
    setLiveLine(getFooterLiveLine(getTodayAcrossSystems()))
  }, [])

  const handleCalculate = async () => {
    if (!birthDate) {
      setFormError('Enter a birth date first.')
      return
    }
    setFormError(null)

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
      // Date-only teasers for the locked sections — all engine calls parse
      // the date string with pure arithmetic (UTC-safe, no new Date(str)).
      sunSign: getSunSign(birthDate),
      tzolkin: dateToTzolkin(birthDate),
      longCount: formatLongCount(dateToLongCount(birthDate)),
    })

    track('calculate_completed', { kin })

    setIsCalculating(false)
  }

  const handleReset = () => {
    setBirthDate('')
    setResult(null)
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* The Dreamspell weave leaning in from the corner — this page IS that system. */}
        <MuralBackdrop
          placement="top-right"
          src="/images/redesign/mural/zone-dreamspell.webp"
          opacity={0.35}
        />

        <div className="relative mx-auto max-w-3xl px-6">
          {/* Hero */}
          <div className="mb-12 text-center">
            <p className={`${TYPE.eyebrow} text-brand`}>Free calculator</p>
            <h1 className={`${TYPE.hero} mx-auto mt-4`}>
              Start with a free Dreamspell reading.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Enter a birth date for a complete Dreamspell reading, plus
              date-based previews from Tzolkin, Long Count, and Astrology.
              No account or card is required.
            </p>
          </div>

          {/* Calculator Form */}
          {!result ? (
            <div className="mb-8 rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="birthdate" className="mb-2 block text-sm font-medium text-white/70">
                      Birth Date
                    </Label>
                    <DateField
                      id="birthdate"
                      value={birthDate}
                      onChange={setBirthDate}
                    />
                  </div>

                  {/* Always full-strength: a disabled-styled primary reads as
                      a broken page. Validation happens on click. */}
                  <Button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="w-full h-12 rounded-xl bg-brand font-medium text-white hover:bg-brand-soft active:scale-[0.98] disabled:opacity-90"
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
                      'Calculate my Dreamspell reading'
                    )}
                  </Button>
                </div>

                {formError && (
                  <p className="mt-3 text-center text-sm text-red-400/90">{formError}</p>
                )}

                <p className="mt-4 text-center text-xs text-white/50">
                  Calculations use the Jos&eacute; Arg&uuml;elles Dreamspell system (1987)
                  with leap-day correction.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 space-y-6">
              {/* Dreamspell — the unlocked reading */}
              <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${SYSTEM_FLAVORS.dreamspell.accent}66 50%, transparent)`,
                  }}
                />
                <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <span
                    className={`${TYPE.eyebrow} inline-flex items-center gap-2`}
                    style={{ color: SYSTEM_FLAVORS.dreamspell.accentSoft }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: SYSTEM_FLAVORS.dreamspell.accent }}
                    />
                    Dreamspell
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Unlocked &middot; free forever
                  </span>
                </div>

                <div className="space-y-8">
                  {/* Result Header */}
                  <div className="text-center">
                    <p className="mb-2 text-sm text-white/50">
                      {/* Parse as LOCAL date — new Date('YYYY-MM-DD') is UTC
                          midnight and shows the previous day west of Greenwich. */}
                      Birth Date: {(() => {
                        const [y, m, d] = birthDate.split('-').map(Number)
                        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      })()}
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
                    <div className="mb-2 font-display text-5xl text-brand-soft">{result.kin}</div>
                    <h2 className={`${TYPE.section} mb-1`}>
                      {result.tone.name} {result.seal.english}
                    </h2>
                    <p className="mb-6 text-white/50">
                      {result.seal.hebrew} {result.tone.nameHebrew}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/70">
                        {result.seal.color.charAt(0).toUpperCase() + result.seal.color.slice(1)} {result.seal.english}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/70">
                        Tone {result.tone.number}: {result.tone.name}
                      </span>
                    </div>

                    {/* Mantra */}
                    <div className="max-w-md mx-auto">
                      <p className="text-lg italic text-white/70 whitespace-pre-line">
                        &ldquo;{result.mantra}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Oracle */}
                  <div className="border-t border-white/10 pt-6">
                    <h3 className={`${TYPE.h3} mb-4 text-center`}>Oracle Map</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Guide', seal: result.oracle.guide },
                        { label: 'Analog', seal: result.oracle.analog },
                        { label: 'Antipode', seal: result.oracle.antipode },
                        { label: 'Occult', seal: result.oracle.occult },
                      ].map(({ label, seal }) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                          <div className="mb-1 text-xs uppercase tracking-wider text-white/40">{label}</div>
                          <img
                            src={getSmallSealGlyphPath(seal.number)}
                            alt={seal.english}
                            className="w-10 h-10 mx-auto mb-1 object-contain"
                          />
                          <div className="text-sm font-medium text-white/90">{seal.english}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <h3 className={TYPE.h3}>Complete this person&apos;s profile</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
                  Your date also gives you Tzolkin and Long Count. Birth time,
                  place, and a Hebrew name add the complete Astrology, Human
                  Design, and Hebrew Gematria layers.
                </p>
              </div>

              <LockedSection
                flavor={SYSTEM_FLAVORS.astrology}
                unlockNote="Needs birth time + place"
                teaser="Your Moon sign, rising sign, houses, and aspects need an exact birth time and place. Add them on an all-systems plan to keep the natal chart beside this person's other readings."
              >
                <div className="mt-6 flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl"
                    style={{ color: SYSTEM_FLAVORS.astrology.accentSoft }}
                    aria-hidden
                  >
                    {result.sunSign.symbol}
                  </span>
                  <div>
                    <div className="font-display text-xl text-white">
                      Sun in {result.sunSign.name}
                    </div>
                    <div className="text-sm capitalize text-white/50">
                      {result.sunSign.element} &middot; {result.sunSign.modality} (read from the date alone)
                    </div>
                  </div>
                </div>
              </LockedSection>

              <LockedSection
                flavor={SYSTEM_FLAVORS.tzolkin}
                unlockNote="All-systems plan"
                teaser="The traditional Maya count sits beside Dreamspell: your day sign, tone, calendar position, and Long Count date in one profile."
              >
                <div className="mt-6">
                  <div className="font-display text-xl text-white">
                    {result.tzolkin.tone} {result.tzolkin.daySign.yucatec}
                  </div>
                  <div className="text-sm text-white/50">
                    {result.tzolkin.daySign.english} in the traditional count &middot; Long Count {result.longCount}
                  </div>
                </div>
              </LockedSection>

              <LockedSection
                flavor={SYSTEM_FLAVORS.humanDesign}
                unlockNote="Needs birth time + place"
                teaser="Your Type, Strategy, Authority, and bodygraph are calculated from an exact birth time and place. Add them once to keep this layer with the person's profile."
              />

              <LockedSection
                flavor={SYSTEM_FLAVORS.gematria}
                unlockNote="Needs a Hebrew name"
                teaser="Hebrew Gematria calculates the value of a Hebrew name and shows how each letter contributes. Add a Hebrew name to include this layer."
              />

              <LockedSection
                flavor={INTEGRATION_FLAVOR}
                unlockNote="Unlocks with all systems"
                teaser="The integrated view places the available systems side by side so you can examine recurring themes without hiding the individual readings."
              />

              {/* Actions */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <Button
                  className="h-12 w-full max-w-md rounded-xl bg-brand font-medium text-white hover:bg-brand-soft active:scale-[0.98]"
                  asChild
                >
                  <Link href="/login">
                    Create a free account to save this person
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-xl border-white/15 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white"
                >
                  Calculate another
                </Button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
            <h3 className={`${TYPE.h3} mb-4`}>About Dreamspell</h3>
            <div className="space-y-3 text-sm text-white/50">
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
                <Link href="/learn/dreamspell" className="text-brand-soft hover:underline">
                  Learn more about the Dreamspell system &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
