import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { YourBoard } from '@/components/bento-lab/app'
import { DashboardPeople, personHref, TiesSections } from '@/components/bento-lab/people'
import { MapFigure } from '@/components/bento-lab/scenes'
import { EmptyState, ErrorState, PageHead, PrimaryAction, Section, site } from '@/components/bento-lab/site'
import { ownedPeople } from '@/lib/atlas/app/owned'
import { atlasPeopleOf, issueLine } from '@/lib/atlas/app/saved-person'
import { birthLine } from '@/lib/atlas/birth-line'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { isoDay } from '@/lib/atlas/light'
import { buildMaya } from '@/lib/atlas/maya'
import { requireUserId } from '@/lib/auth-server'
import { siteHref } from '@/lib/site/routes'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayFigures } from '@/lib/today-figures'

/** The layout's title template skips a page in its own segment, so this one is spelled out. */
export const metadata: Metadata = { title: { absolute: 'Today · Pleiad' } }

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const ADD_PERSON = `${siteHref('/app/people')}?add=1`

/**
 * T3 Board, signed in (BENTO_SITE.md "Signed-in app"): the home page's
 * sections with the account's own data. The account's person is drawn on the
 * server; ties and the circle are read in the browser.
 */
export default async function AppTodayPage() {
  const now = new Date()
  const day = isoDay(now)
  const today = buildMaya(day)
  const board = getTodayAcrossSystems(now)
  const rows = await ownedPeople(await requireUserId())
  const { people, unreadable } = atlasPeopleOf(rows)
  const selfId = rows.find((row) => row.is_self)?.id
  const self = people.find((person) => person.id === selfId) ?? people[0] ?? null
  const isSelf = self !== null && self.id === selfId
  const atlas = self ? buildPersonAtlas(self.input, day) : null
  const todayLine = `Today is Kin ${today.kin}, ${today.title}.`

  return (
    <>
      <PageHead
        eyebrow={DAY.format(now)}
        title={self ? (isSelf ? 'Your map' : `${self.name}'s map`) : 'Start with one birth date'}
        lead={self ? `${self.name}, ${birthLine(self)}. ${todayLine}` : `${todayLine} Save a birth date and its map, its ties and its circle are drawn here.`}
      >
        {self ? (
          <Link href={personHref(self.id)} className={`${site.btn} ${site.btnSmall}`}>
            Open the full map
            <ArrowRight size={15} aria-hidden />
          </Link>
        ) : null}
      </PageHead>

      <div className={site.page}>
        {atlas ? (
          <MapFigure atlas={atlas} />
        ) : unreadable.length > 0 ? (
          <ErrorState
            title="Your saved people need fixing"
            action={
              <Link href={siteHref('/app/people')} className={`${site.btn} ${site.btnSmall}`}>
                Open people
              </Link>
            }
          >
            {unreadable.map((u) => `${u.name}: ${issueLine(u.error)}`).join(' ')}
          </ErrorState>
        ) : (
          <EmptyState
            title="No one saved yet"
            action={
              <PrimaryAction href={ADD_PERSON} intent="add">
                Add a person
              </PrimaryAction>
            }
          >
            Start with your own birth date. The map draws itself here.
          </EmptyState>
        )}
      </div>

      <Section id="today" eyebrow="Every day" title="Today, across the calendars" lead="The kin, the Moon, the Sun's gate and the dates of every calendar you follow. The board turns over at midnight UTC.">
        <YourBoard board={board} day={day} figures={todayFigures(day, board)} />
      </Section>

      {self && <TiesSections self={self} others={people.filter((person) => person.id !== self.id)} today={day} show="dashboard" />}

      <Section id="people" eyebrow="Your people" title="Everyone you mapped" lead="Open a person for their full map, or pick two to see their ties.">
        <DashboardPeople />
      </Section>
    </>
  )
}
