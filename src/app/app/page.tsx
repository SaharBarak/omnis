import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { peopleOnce } from './_data'
import s from './_dash/dash.module.css'
import { DayFeed } from './_dash/day-feed'
import { ChangeMap, KeepCard } from './_dash/map-editor'
import { StrongestTie, TiesProvider, YourCircle } from './_dash/ties'
import { Hung, Notch, kit } from '@/components/bento-lab'
import { appHrefs } from '@/components/bento-lab/people'
import { PrimaryAction } from '@/components/bento-lab/site'
import { KinFace, LivePill, MapWindow, PixelMark, frame as f } from '@/components/bento-v2'
import { MISSING_LABEL, atlasPeopleOf, issueLine, mapGapsOf } from '@/lib/atlas/app/saved-person'
import { sketchFor } from '@/lib/atlas/app/sketch'
import { birthLine } from '@/lib/atlas/birth-line'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { isoDay } from '@/lib/atlas/light'
import { buildMaya } from '@/lib/atlas/maya'
import type { BirthInput } from '@/lib/atlas/types'
import { requireUserId } from '@/lib/auth-server'
import { kinOfDay } from '@/lib/site/v2-home'
import { readSketch } from '@/lib/site/v2-sketch-cookie'
import { daySources } from '@/lib/today-sources'

export const metadata: Metadata = { title: { absolute: 'Today · Pleiad v2' } }

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const HREFS = appHrefs('v2')
const NO_BIRTH: BirthInput = { date: '', time: null, place: null, name: null, hebrewName: null }

/**
 * The v2 dashboard (BENTO_V2.md "Dashboard"): the reference portal's grid
 * with the account's own data. The account's person is drawn on the server;
 * ties are read in the browser, once, for the pair and circle panels. Every
 * read is owner-scoped.
 */
export default async function V2Dashboard() {
  const now = new Date()
  const day = isoDay(now)
  const userId = await requireUserId()
  /* The rows, figures and boards, read at the day's noon, UTC, once a day. */
  const [rows, kept, sources] = await Promise.all([peopleOnce(userId), readSketch(), daySources(day)])
  const kin = kinOfDay(day, sources)
  const sketch = sketchFor(kept, userId)
  const { people, unreadable } = atlasPeopleOf(rows)
  const selfRow = rows.find((row) => row.is_self)
  const self = people.find((person) => person.id === selfRow?.id) ?? people[0] ?? null
  const isSelf = self !== null && self.id === selfRow?.id
  const others = self ? people.filter((person) => person.id !== self.id) : []
  const atlas = self ? buildPersonAtlas(self.input, day) : null
  const rowOf = new Map(rows.map((row) => [row.id, row]))
  const sketchMaya = sketch ? buildMaya(sketch.input.date) : null

  return (
    <TiesProvider self={self} others={others} today={day}>
      <div className={s.grid}>
        {sketch && sketchMaya ? (
          <KeepCard
            key={sketch.nonce}
            nonce={sketch.nonce}
            input={sketch.input}
            hasSelf={selfRow !== undefined}
            summary={{ kin: sketchMaya.kin, title: sketchMaya.title, line: birthLine({ id: 'kept', name: '', input: sketch.input }) }}
          />
        ) : null}
        <section className={`${f.panel} ${f.art} ${s.greet}`} aria-labelledby="v2-greet">
          <PixelMark />
          <div className={s.greetText}>
            <p className={f.eyebrow}>
              {DAY.format(now)} · Kin {kin.kin}
            </p>
            <h1 id="v2-greet" className={f.title}>
              {self ? (
                <>
                  <Hung className={f.line}>{isSelf ? 'Your map,' : 'The map of'}</Hung>
                  <Hung className={f.bright}>{`${self.name}.`}</Hung>
                </>
              ) : (
                <>
                  <Hung className={f.line}>Start with</Hung>
                  <Hung className={f.bright}>one birth date.</Hung>
                </>
              )}
            </h1>
          </div>
          <Notch corner="br" className={s.greetNotch}>
            <div className={f.notchContent}>
              <PrimaryAction href={HREFS.addPerson} intent="add" size="small">
                Add a person
              </PrimaryAction>
              {selfRow ? <ChangeMap seed={isSelf && self ? self.input : NO_BIRTH} /> : null}
              {self ? (
                <Link href={HREFS.person(self.id)} className={f.round} aria-label={`Open ${self.name}'s full map`}>
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
              ) : null}
            </div>
          </Notch>
        </section>

        <section className={`${f.panel} ${f.accent} ${f.pad} ${s.kin}`} aria-label="Today's kin">
          <KinFace kin={kin} head={<LivePill>Today&apos;s kin</LivePill>} />
        </section>

        <StrongestTie />

        <DayFeed sources={sources} className={`${f.panel} ${f.pad} ${s.feed}`} />

        <section className={s.people} aria-labelledby="v2-people">
          <h2 id="v2-people" className={kit.srOnly}>
            Your people
          </h2>
          {people.map((person) => {
            const row = rowOf.get(person.id)
            const gaps = row ? mapGapsOf(row) : []
            const maya = buildMaya(person.input.date)
            return (
              <Link key={person.id} href={HREFS.person(person.id)} className={`${f.panel} ${f.pad} ${s.person}`}>
                <span className={s.personHead}>
                  <span className={f.eyebrow}>{isSelf && person.id === self?.id ? `You · Kin ${maya.kin}` : `Kin ${maya.kin}`}</span>
                  <span className={`${s.status} ${gaps.length === 0 ? s.statusFull : ''}`}>{gaps[0] ? MISSING_LABEL[gaps[0]] : 'Full map'}</span>
                </span>
                <Hung className={s.personName}>{person.name}</Hung>
                <span className={f.caption}>{maya.title}</span>
                <span className={f.caption}>{birthLine(person)}</span>
              </Link>
            )
          })}
          {unreadable.map((u) => (
            <div key={u.id} className={`${f.panel} ${f.pad} ${s.person}`}>
              <Hung className={s.personName}>{u.name}</Hung>
              <span className={f.caption}>{issueLine(u.error)}</span>
            </div>
          ))}
          <Link href={HREFS.addPerson} className={`${f.panel} ${f.pad} ${s.person} ${s.addPerson}`}>
            <Hung className={s.personName}>Add a person</Hung>
            <span className={f.caption}>Two maps show your ties; three or more make a circle.</span>
          </Link>
        </section>

        <YourCircle />

        {atlas && self ? <MapWindow atlas={atlas} title={`${self.name}'s map`} meta={birthLine(self)} className={s.map} currents /> : null}
      </div>
    </TiesProvider>
  )
}
