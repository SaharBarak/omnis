import { CircleSection, DailySection, LayersSection, MethodSection, PairSection } from './_home/sections'
import { Hero } from './_home/hero'
import { CloseCta, FaqList, PlanCards, PlanLedger } from '@/components/bento-lab/blocks'
import { Section } from '@/components/bento-lab/site'
import { buildCircleAtlas, buildPairAtlas, buildPersonAtlas } from '@/lib/atlas/build'
import { birthLine } from '@/lib/atlas/birth-line'
import { DEMO_ATLAS_PEOPLE, demoPerson } from '@/lib/atlas/demo'
import { isoDay } from '@/lib/atlas/light'
import { buildBentoLab } from '@/lib/data/bento-lab'
import { PORTAL_LOOP } from '@/lib/data/lab-media'
import { HOME_FAQ } from '@/lib/site/faq'
import { siteHref } from '@/lib/site/routes'
import { getTodayAcrossSystems } from '@/lib/today-board'

export const revalidate = 3600

/** T1 Home (docs/redesign/BENTO_SITE.md, "Page order"). Every chart on it is computed here by the engine. */
export default function BentoHome() {
  const now = new Date()
  const today = isoDay(now)
  const maya = demoPerson('maya')
  const ari = demoPerson('ari')
  const atlas = buildPersonAtlas(maya.input, today)
  const pair = buildPairAtlas(maya, ari, today)

  return (
    <>
      <Hero
        seed={{ person: maya, atlas, partner: ari, pair, sampleLine: birthLine(maya), partnerLine: birthLine(ari) }}
        today={today}
        artwork={PORTAL_LOOP}
      />
      <LayersSection atlas={atlas} name={maya.name} />
      <PairSection pair={pair} />
      <CircleSection circle={buildCircleAtlas(DEMO_ATLAS_PEOPLE)} />
      <DailySection board={getTodayAcrossSystems(now)} day={today} />
      <MethodSection lab={buildBentoLab(now)} pair={pair} />
      <Section id="pricing" eyebrow="Pricing" title="Free to map. Pay to keep more people." lead="Every line below is read from the limits billing enforces.">
        <PlanCards />
        <PlanLedger />
      </Section>
      <Section id="faq" eyebrow="Questions" title="Before you start">
        <FaqList items={HOME_FAQ} />
      </Section>
      <CloseCta
        media={PORTAL_LOOP}
        title="Start with one birth date"
        body="The map draws in your browser. Nothing is saved until you make an account."
        href={siteHref('/map')}
        action="Map a birth date"
      />
    </>
  )
}
