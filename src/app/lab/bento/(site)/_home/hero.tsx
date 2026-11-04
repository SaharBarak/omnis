'use client'

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { Plus, X } from 'lucide-react'
import s from './hero.module.css'
import { PixelVideo, kit } from '@/components/bento-lab'
import { AtlasReadout, AtlasStage, PairDrawing, StageBadge, TieList, atlasStyles } from '@/components/bento-lab/atlas'
import { AtlasDigest } from '@/components/bento-lab/atlas/digest'
import { BirthFields } from '@/components/bento-lab/atlas/birth-fields'
import { PrimaryAction, site } from '@/components/bento-lab/site'
import { DIGEST } from '@/lib/atlas/layers'
import { loadPairAtlas, loadPersonAtlas } from '@/lib/atlas/load'
import type { AtlasPerson } from '@/lib/atlas/pair'
import type { AtlasLayerId, PairAtlas, PersonAtlas } from '@/lib/atlas/types'
import { useAtlasDraft, type AtlasDraft } from '@/lib/atlas/use-atlas-draft'
import type { LabMedia } from '@/lib/data/lab-media'
import { INPUT_SETTLE_MS, useDeferredCompute } from '@/lib/hooks/use-deferred-compute'
import { Spelled } from '@/lib/site/number-words'
import { signInHref, siteHref } from '@/lib/site/routes'

export interface HeroSeed {
  readonly person: AtlasPerson
  readonly atlas: PersonAtlas
  readonly partner: AtlasPerson
  readonly pair: PairAtlas
  /** One line describing the sample person's birth data, from the data itself. */
  readonly sampleLine: string
  readonly partnerLine: string
}

const READOUT_ID = 'hero-readout'

/** The claim counts the systems the digest shows, so it can't drift from the tiles beside it. */
const CLAIM = `${Spelled(DIGEST.length)} systems. One map.`

const personOf = (base: AtlasPerson, form: AtlasDraft, fallback: string): AtlasPerson | null =>
  form.input ? { id: base.id, name: form.sample ? base.name : fallback, input: form.input } : null

function Sample({ name, line }: { name: string; line: string }) {
  return (
    <p className={s.sample}>
      Sample: <strong>{name}</strong>, {line}
    </p>
  )
}

function Backdrop({ artwork }: { artwork: LabMedia }) {
  return (
    <>
      <PixelVideo media={artwork} preload="auto" className={s.art} />
      <div className={s.scrim} />
    </>
  )
}

export function Hero({ seed, today, artwork }: { readonly seed: HeroSeed; readonly today: string; readonly artwork: LabMedia }) {
  const [mode, setMode] = useState<'one' | 'two'>('one')
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)
  const formA = useAtlasDraft(seed.person.input)
  const formB = useAtlasDraft(seed.partner.input)

  const one = useDeferredCompute(
    formA.input,
    (input) => loadPersonAtlas(input, today),
    { input: seed.person.input, value: seed.atlas },
    INPUT_SETTLE_MS,
    [today],
  )
  const personA = personOf(seed.person, formA, 'You')
  const personB = personOf(seed.partner, formB, 'Second person')
  const two = useDeferredCompute(
    mode === 'two' && personA && personB ? { a: personA, b: personB } : null,
    ({ a, b }) => loadPairAtlas(a, b, today),
    { input: { a: seed.person, b: seed.partner }, value: seed.pair },
    INPUT_SETTLE_MS,
    [today],
  )

  const atlas = one.value ?? seed.atlas
  const pair = two.value ?? seed.pair
  const names = { [pair.people[0].id]: pair.people[0].name, [pair.people[1].id]: pair.people[1].name }

  return (
    <section className={`${site.page} ${s.hero}`} aria-labelledby="hero-title">
      <div className={`${s.claim} ${kit.rise}`}>
        <div className={s.claimTop}>
          <h1 id="hero-title" className={site.h2}>
            {CLAIM}
          </h1>
          <p className={`${site.body} ${s.lead}`}>Start with your birth date.</p>
        </div>
        <div className={s.person}>
          <BirthFields id="hero-a" form={formA} dense />
          {formA.sample && <Sample name={seed.person.name} line={seed.sampleLine} />}
        </div>
        <div className={site.actions}>
          <PrimaryAction href={signInHref('/app/people')}>Keep this map</PrimaryAction>
          <Link href={siteHref('/map')} className={site.btn}>
            Open the full map
          </Link>
        </div>
      </div>

      {mode === 'one' ? (
        <AtlasStage
          atlas={atlas}
          status={one}
          focus={focus}
          onFocus={setFocus}
          readoutId={READOUT_ID}
          className={s.stageSlot}
          background={<Backdrop artwork={artwork} />}
          fit
        />
      ) : (
        <div className={`${atlasStyles.stage} ${s.stageSlot}`} aria-busy={two.status === 'loading'}>
          <Backdrop artwork={artwork} />
          <div className={atlasStyles.stageTop}>
            <span className={kit.eyebrow}>Two people, one map</span>
            <StageBadge {...two} idle={`${pair.reading.ties.length} ties checked · rarity ${pair.reading.rarity}`} />
          </div>
          <div className={s.pairDrawing} data-busy={two.status === 'loading' ? '' : undefined}>
            <PairDrawing pair={pair} describedBy="hero-ties" />
          </div>
          <div />
        </div>
      )}

      <aside className={`${s.side} ${kit.rise}`} style={{ '--i': 2 } as CSSProperties} aria-label="Readout">
        {mode === 'one' ? (
          <>
            <AtlasDigest atlas={atlas} focus={focus} onFocus={setFocus} className={s.digest} />
            <AtlasReadout atlas={atlas} id={READOUT_ID} focus={focus} className={kit.srOnly} />
            <button type="button" className={site.btn} onClick={() => setMode('two')}>
              <Plus size={16} aria-hidden />
              Add a second person
            </button>
          </>
        ) : (
          <>
            <div className={s.personHead}>
              <span className={kit.eyebrow}>Second person</span>
              <button type="button" className={kit.iconButton} onClick={() => setMode('one')} aria-label="Back to one person">
                <X size={14} aria-hidden />
              </button>
            </div>
            <BirthFields id="hero-b" form={formB} dense />
            {formB.sample && <Sample name={seed.partner.name} line={seed.partnerLine} />}
            <div id="hero-ties" style={{ display: 'grid', gap: 10 }}>
              <span className={kit.eyebrow}>Rarest ties</span>
              <TieList reading={pair.reading} names={names} />
            </div>
            <Link href={siteHref('/pair')} className={site.btn}>
              Open the pair map
            </Link>
          </>
        )}
      </aside>
    </section>
  )
}
