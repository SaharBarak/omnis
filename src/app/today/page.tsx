import { Metadata } from 'next'
import Link from 'next/link'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { generateMantra } from '@pleiad/engine/data/mantras'
import { NavV2, FooterV2, StarParallax, MuralBackdrop, AmbientVideo } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import { getSealGlyphPath, getSmallSealGlyphPath } from '@/lib/dreamspell-assets'
import { getSealMeaning, getToneMeaning, composeKinCombination } from '@/lib/dreamspell-meanings'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: "Today's Dreamspell Kin - Free Daily Galactic Reading",
  description: "Discover today's Dreamspell Kin, solar seal, galactic tone, oracle, and daily mantra. Free daily Dreamspell reading updated every day.",
  keywords: "dreamspell, kin of the day, today's kin, daily dreamspell, galactic signature, daily galactic reading",
  alternates: {
    canonical: '/today',
  },
  openGraph: {
    title: "Today's Dreamspell Kin - Free Daily Galactic Reading",
    description: "Today's Dreamspell Kin, oracle, and cosmic guidance. Free daily reading.",
    url: '/today',
  },
}

const speakableSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Today's Dreamspell Kin - Free Daily Galactic Reading",
  "url": `${SITE_URL}/today`,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".daily-kin-summary", ".daily-mantra"],
  },
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: "Today's Kin", url: `${SITE_URL}/today` },
])

// Revalidate every hour to update the kin
export const revalidate = 3600

/** Dreamspell seal-family colors — same discs as the homepage ego star. */
const SEAL_COLOR_HEX: Record<string, string> = {
  red: '#C0392B',
  white: '#ECF0F1',
  blue: '#2C3E90',
  yellow: '#F1C40F',
}

function sealHex(color: string): string {
  return SEAL_COLOR_HEX[color] ?? '#ECF0F1'
}

function getOracleSeal(sealNumber: number) {
  return SEALS.find(s => s.number === sealNumber)!
}

/** Glyph in a tinted circular chip — the homepage Person-glyph treatment. */
function SealChip({
  sealNumber,
  color,
  alt,
  sizeClass = 'h-24 w-24',
  glyphClass = 'h-14 w-14',
  small = false,
}: {
  sealNumber: number
  color: string
  alt: string
  sizeClass?: string
  glyphClass?: string
  small?: boolean
}) {
  const hex = sealHex(color)
  return (
    <span
      className={`grid place-items-center rounded-full border-2 ${sizeClass}`}
      style={{ backgroundColor: `${hex}22`, borderColor: `${hex}88` }}
    >
      <img
        src={small ? getSmallSealGlyphPath(sealNumber) : getSealGlyphPath(sealNumber)}
        alt={alt}
        className={`${glyphClass} object-contain`}
      />
    </span>
  )
}

/** Galactic tone as Mayan notation — bars of five, dots of one. */
function ToneDots({ tone }: { tone: number }) {
  const bars = Math.floor(tone / 5)
  const dots = tone % 5
  return (
    <span className="flex items-center gap-1.5" aria-label={`Tone ${tone}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={`bar-${i}`} className="h-1.5 w-6 rounded-full bg-white/70" />
      ))}
      {Array.from({ length: dots }).map((_, i) => (
        <span key={`dot-${i}`} className="h-1.5 w-1.5 rounded-full bg-white/70" />
      ))}
    </span>
  )
}

export default function TodayPage() {
  const liveLine = getFooterLiveLine(getTodayAcrossSystems())

  // One zone for everything: the kin and the headline date must come from
  // the same calendar day, so derive the ISO string from server-local parts
  // (toISOString() is UTC and diverges from toLocaleDateString when TZ≠UTC).
  const today = new Date()
  const dateStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  // Calculate today's kin
  const kin = dateToKin(dateStr)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = SEALS.find(s => s.number === sealNumber)!
  const tone = TONES.find(t => t.number === toneNumber)!
  const mantra = generateMantra(seal, tone)
  const oracle = calculateOracle(kin)
  const sealMeaning = getSealMeaning(sealNumber)
  const toneMeaning = getToneMeaning(toneNumber)
  const kinCombination = composeKinCombination(sealNumber, toneNumber)

  // Get oracle seals
  const guideSeal = getOracleSeal(oracle.guide)
  const analogSeal = getOracleSeal(oracle.analog)
  const antipodeSeal = getOracleSeal(oracle.antipode)
  const occultSeal = getOracleSeal(oracle.occult)

  const oraclePositions = [
    { label: 'Guide', seal: guideSeal },
    { label: 'Analog', seal: analogSeal },
    { label: 'Antipode', seal: antipodeSeal },
    { label: 'Occult', seal: occultSeal },
  ]

  // Format date for display
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />

      <JsonLd data={speakableSchema} id="json-ld-speakable" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* Today's sky, literally — the hero mural loop fading down into the page. */}
        <MuralBackdrop placement="top" opacity={0.5}>
          <AmbientVideo
            webmSrc="/videos/redesign/hero-sky-loop.webm"
            mp4Src="/videos/redesign/hero-sky-loop.mp4"
            poster="/images/redesign/mural/hero-sky.webp"
            className="h-full w-full object-cover"
          />
        </MuralBackdrop>

        {/* Hero — the kin is the headline, the date is the context. */}
        <section className="relative mx-auto max-w-content px-6 text-center">
          <p className={`${TYPE.eyebrow} text-brand`}>Today&apos;s Dreamspell Kin</p>
          <h1 className={`${TYPE.hero} daily-kin-summary mx-auto mt-4 max-w-3xl`}>
            {tone.name} {seal.english}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            {formattedDate}
          </p>
        </section>

        <div className="relative mx-auto mt-14 max-w-3xl px-6">
          {/* Main kin card */}
          <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Glyph + tone lockup */}
              <div className="flex flex-col items-center gap-3">
                <SealChip
                  sealNumber={seal.number}
                  color={seal.color}
                  alt={seal.english}
                />
                <ToneDots tone={tone.number} />
                <p className={`${TYPE.eyebrow} text-white/50`}>
                  Kin {kin} · Tone {tone.number}
                </p>
              </div>

              {/* Names */}
              <p className="mt-6 font-display text-2xl text-white">
                {tone.name} {seal.english}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {seal.hebrew} {tone.nameHebrew}
              </p>

              {/* Family + tone labels */}
              <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span className={`${TYPE.eyebrow} inline-flex items-center gap-2 text-white/50`}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: sealHex(seal.color) }}
                  />
                  {seal.color} {seal.english}
                </span>
                <span className={`${TYPE.eyebrow} text-white/50`}>
                  Tone {tone.number} · {tone.name}
                </span>
              </div>

              {/* Mantra — a quote, not a caption. */}
              <blockquote className="daily-mantra mt-8 w-full max-w-md border-l-2 border-brand pl-6 text-left font-display text-xl leading-relaxed text-white/80 whitespace-pre-line">
                {mantra}
              </blockquote>
            </div>
          </div>

          {/* Oracle */}
          <section className="mt-16">
            <h2 className={`${TYPE.section} text-center`}>Today&apos;s Oracle</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {oraclePositions.map(({ label, seal: oracleSeal }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-2xl border border-white/10 bg-surface p-5 text-center"
                >
                  <p className={`${TYPE.eyebrow} text-white/50`}>{label}</p>
                  <div className="mt-3">
                    <SealChip
                      sealNumber={oracleSeal.number}
                      color={oracleSeal.color}
                      alt={oracleSeal.english}
                      sizeClass="h-14 w-14"
                      glyphClass="h-8 w-8"
                      small
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-white/90">{oracleSeal.english}</p>
                  <p className="mt-0.5 text-xs text-white/50">{oracleSeal.hebrew}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Interpretation */}
          <section className="mt-16">
            <h2 className={TYPE.section}>What does this mean?</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/70">
              <p>
                <strong className="font-medium text-white">
                  {toneMeaning.name} (Tone {toneMeaning.number})
                </strong>
                : {toneMeaning.paragraph}
              </p>

              <p>
                <strong className="font-medium text-white">{sealMeaning.name}</strong> ({seal.mayan}):{' '}
                {sealMeaning.paragraph}
              </p>

              <p>{kinCombination}</p>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 text-center">
            <p className="text-lg text-white/70">
              Want to know <strong className="font-medium text-white">your</strong> personal kin?
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5 active:scale-[0.98]"
              >
                Create Free Account
              </Link>
            </div>
          </section>
        </div>
      </main>

      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
