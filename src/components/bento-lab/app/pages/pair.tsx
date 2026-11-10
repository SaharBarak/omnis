import { redirect } from 'next/navigation'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import { PairPicker, RecordMissing, appHrefs } from '@/components/bento-lab/people'
import { PairScene } from '@/components/bento-lab/scenes'
import { APPEARANCE, EmptyState, ErrorState, PageBlock, PageHead, PageStack, Section, site } from '@/components/bento-lab/site'
import { atlasPersonOf, issueLine } from '@/lib/atlas/app/saved-person'
import { BIRTH_FIELD_LABEL } from '@/lib/atlas/birth-input'
import { ownedPeople, routeId } from '@/lib/atlas/app/owned'
import { buildPairAtlas } from '@/lib/atlas/build'
import { isoDay } from '@/lib/atlas/light'
import { requireUserId } from '@/lib/auth-server'
import { centerName } from '@/lib/relations/pair-ties'
import { tieOdds } from '@/lib/relations/tie-text'
import type { SiteTree } from '@/lib/site/routes'

/**
 * Two saved people's page (T11, BENTO_V2.md "The app in v2"): a picker for
 * either person, the pair scene with its tie table, the centres they define
 * together. The same body in either tree; one person twice opens their page.
 */
export async function PairPageBody({ tree, params }: { readonly tree: SiteTree; readonly params: Promise<{ readonly a: string; readonly b: string }> }) {
  const appearance = APPEARANCE[tree]
  const hrefs = appHrefs(tree)
  const missing = (
    <RecordMissing
      eyebrow="Two people"
      title="Pair not found"
      body="One of these people was deleted or the link is wrong."
      back={hrefs.people}
      backLabel="Back to people"
      appearance={appearance}
    />
  )
  const raw = await params
  const [a, b] = [routeId(raw.a), routeId(raw.b)]
  if (!a || !b) return missing
  if (a === b) redirect(hrefs.person(a))

  const everyone = await ownedPeople(await requireUserId())
  const rowA = everyone.find((person) => person.id === a)
  const rowB = everyone.find((person) => person.id === b)
  if (!rowA || !rowB) return missing
  const picker = <PairPicker people={everyone.map((person) => ({ id: person.id, name: person.name }))} a={a} b={b} />

  const [readA, readB] = [atlasPersonOf(rowA), atlasPersonOf(rowB)]
  if (!readA.success || !readB.success) {
    const [row, issue] = readA.success ? [rowB, readB.success ? null : readB.error] : [rowA, readA.error]
    return (
      <PageStack appearance={appearance}>
        <PageHead eyebrow="Two people" title={`${rowA.name} and ${rowB.name}`} appearance={appearance}>
          {picker}
        </PageHead>
        <PageBlock appearance={appearance}>
          <ErrorState title={`${row.name}'s ${issue ? BIRTH_FIELD_LABEL[issue.field] : 'birth data'} cannot be read`}>
            {issue && issueLine(issue)} Fix it in {row.name}&apos;s details to draw this pair.
          </ErrorState>
        </PageBlock>
      </PageStack>
    )
  }
  const [personA, personB] = [readA.data, readB.data]

  const pair = buildPairAtlas(personA, personB, isoDay(new Date()))
  const drawn = pair.reading.ties.filter((t) => mayDrawEdge(t.baseRate)).length
  const emergent = pair.reading.ties.filter((t) => t.type === 'emergent-center' && t.channel)
  const bodies = pair.a.body !== null && pair.b.body !== null

  return (
    <PageStack appearance={appearance}>
      <PageHead
        eyebrow="Two people"
        title={`${personA.name} and ${personB.name}`}
        lead={`Rarity ${pair.reading.rarity} of 100. ${pair.reading.ties.length} ties found, ${drawn} rare enough to draw.`}
        appearance={appearance}
      >
        {picker}
      </PageHead>
      <PageBlock appearance={appearance}>
        <PairScene pair={pair} />
      </PageBlock>
      <Section
        id="centres"
        eyebrow="Human Design"
        title="Centres they define together"
        lead="A centre neither chart defines alone, defined once the two charts sit together."
        appearance={appearance}
      >
        {!bodies ? (
          <EmptyState title="Both birth times are needed">Bodygraphs need a birth time and place for each person.</EmptyState>
        ) : emergent.length === 0 ? (
          <EmptyState title="None between them">Every centre defined between them is already defined in one chart.</EmptyState>
        ) : (
          <ul className={site.chipRow}>
            {emergent.map((t) => (
              <li key={t.channel} className={site.chip}>
                {centerName(t.channel ?? '')} · {tieOdds(t.baseRate)}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageStack>
  )
}
