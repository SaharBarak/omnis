'use client'

import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import y from './why-frame.module.css'
import { Hung, Notch } from '@/components/bento-lab'
import { Chips, countUp, frame as f, groundProps, plateIn, rise, useScrollScene, type ChipItem } from '@/components/bento-v2'
import { DIGEST } from '@/lib/atlas/layers'
import { V2_MOTION, V2_SCENES } from '@/lib/design/v2-scenes'
import { Spelled } from '@/lib/site/number-words'
import type { V2Home } from '@/lib/site/v2-home'

interface Comparison {
  readonly id: string
  readonly label: string
  readonly rows: ReadonlyArray<readonly [what: string, pleiad: string, other: string]>
  readonly note: { readonly title: string; readonly text: string }
}

const COMPARISONS: readonly Comparison[] = [
  {
    id: 'horoscope',
    label: 'A sun-sign horoscope',
    rows: [
      ['What it reads', `${Spelled(DIGEST.length)} systems from one birth date`, 'The sign the Sun was in'],
      ['Time and place', 'Used where a system needs them: rising sign, houses, bodygraph', 'Not asked'],
      ['Two people', 'Every tie between two maps, each with its odds', 'Two signs and a stock paragraph'],
      ['Rarity', 'Each tie carries its measured share of random pairs', 'Every match reads as special'],
      ['Every day', 'The kin, the Moon, the gate and the calendars, for the date', 'One text per sign'],
    ],
    note: {
      title: 'A sun-sign horoscope',
      text: 'Twelve texts for everyone on Earth, one per month of birth. It reads the season you were born in and nothing else about you.',
    },
  },
  {
    id: 'score',
    label: 'A compatibility score',
    rows: [
      ['The result', 'Named ties you can read, each with its odds', 'One number out of a hundred'],
      ['Rarity', 'Weighed by measured base rates', 'Overlaps added up'],
      ['Common ties', 'Counted, never drawn', 'Counted as wins'],
      ['Systems', 'Each tradition by its own rules', 'One blended formula'],
      ['Groups', 'A whole circle, and who holds it together', 'Pairs only'],
    ],
    note: {
      title: 'A compatibility score',
      text: 'A single figure built from every overlap two charts have. Most overlaps are shared by most pairs, so the figure mostly measures chance.',
    },
  },
]

const GROUND = groundProps('why', `${f.frame} ${f.frameFlip}`)

const CHIPS: readonly ChipItem[] = COMPARISONS.map(({ id, label }) => ({
  id,
  label,
}))

/** A share as its number and unit, so the number can count. */
const splitPercent = (percent: string): readonly [string, string] => {
  const match = /^([\d.]+)(.*)$/.exec(percent)
  return match ? [match[1] ?? percent, match[2] ?? ''] : [percent, '']
}

/**
 * Why (BENTO_V2.md "Home" 6): why weigh ties by rarity.
 * The focus is the table against the two things people usually compare
 * with; beside it one gold proof, the guide tie's measured share set against
 * the commonest tie's, the one Pleiad counts and never draws.
 */
export function WhyFrame({ home }: { readonly home: V2Home }) {
  const [index, setIndex] = useState(0)
  const comparison = COMPARISONS[index] ?? COMPARISONS[0]
  const scene = useScrollScene<HTMLElement>((scope) => {
    plateIn(scope, V2_SCENES.plateIn, V2_MOTION.plateFrom)
    rise(scope, V2_SCENES.proofsIn, [...scope.root.querySelectorAll('[data-proof]')])
    countUp(scope, V2_SCENES.proofsIn, V2_MOTION.countMs)
  })
  const [guideValue, guideUnit] = splitPercent(home.guide.percent)
  const [commonValue, commonUnit] = splitPercent(home.commonest.percent)

  return (
    <section ref={scene} id="why" {...GROUND} aria-labelledby="v2-why-title">
      <div className={`${f.panel} ${f.accent} ${f.pad} ${y.proof}`} data-proof>
        <p className={f.eyebrow}>Weighed, not counted</p>
        <Hung as="p" className={`${f.numeral} ${y.number}`} figures="tabular" lead={String(guideValue)}>
          <span data-count={guideValue}>{guideValue}</span>
          {guideUnit}
        </Hung>
        <p className={f.small}>of random pairs share this tie: {home.guide.label}. Rare ties like it are the ones the map draws.</p>
        <p className={`${f.small} ${y.against}`}>
          Against <span data-count={commonValue}>{commonValue}</span>
          {commonUnit} for {home.commonest.label}: Pleiad counts that one and never draws it.
        </p>
      </div>

      <div className={`${f.panel} ${y.compare}`} data-proof>
        <Notch corner="tl" className={`${y.titleNotch} ${f.notchStack}`}>
          <h2 id="v2-why-title" className={`${f.title} ${f.titleDisplay}`}>
            <Hung className={f.line}>Why a map beats</Hung>
            <Hung className={f.bright}>a single answer</Hung>
          </h2>
        </Notch>
        <Notch corner="tr" className={`${y.toggleNotch} ${f.notchStack}`}>
          <div className={f.notchContent}>
            <Chips items={CHIPS} value={index} onPick={setIndex} label="Compare Pleiad with" group="why-compare" solid />
          </div>
        </Notch>

        <div className={y.tableWrap}>
          {/* Explicit roles: stacked, the rows are laid out as grids, and a table's display change drops its semantics in some browsers. */}
          <table className={y.table} role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  What
                </th>
                <th scope="col" role="columnheader">
                  Pleiad
                </th>
                <th scope="col" role="columnheader">
                  {comparison?.label}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {comparison?.rows.map(([what, pleiad, other]) => (
                <tr key={what} role="row">
                  <th scope="row" role="rowheader">
                    {what}
                  </th>
                  <td className={y.ours} role="cell">
                    <span className={y.cell}>
                      <Check aria-hidden /> {pleiad}
                    </span>
                  </td>
                  <td className={y.theirs} role="cell">
                    <span className={y.cell}>
                      <Minus aria-hidden /> {other}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <m.div key={comparison?.id} className={`${f.inset} ${y.note}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className={y.noteTitle}>{comparison?.note.title}</p>
            <p className={f.small}>{comparison?.note.text}</p>
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
