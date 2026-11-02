import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowUpRight, BookOpen, ChevronDown } from 'lucide-react'
import s from './systems.module.css'
import type { SavedPerson, SystemStatus } from './use-system-people'
import kit from '../kit.module.css'
import { EmptyState, ErrorState, Loading, PrimaryAction, Skeleton } from '../site'
import site from '../site/site.module.css'
import { MISSING_LABEL, type MissingField } from '@/lib/atlas/app/saved-person'
import { PLANS } from '@/lib/services/billing'
import type { PlanId } from '@/lib/site/plans'
import { siteHref } from '@/lib/site/routes'

/** What a system page is: copy, art and links, bound once per route. */
export interface SystemPageSpec {
  /** Route path in the site table, e.g. `/app/numerology`. */
  readonly path: string
  readonly title: string
  readonly eyebrow: string
  readonly lead: string
  /** What this layer reads, in one or two sentences. */
  readonly reads: string
  /** Mural still for the banner. */
  readonly mural: string
  /** A colour token, e.g. `var(--sys-gematria)`. */
  readonly accent: string
  /** Library article slug for the learn link. */
  readonly article: string | null
  /** The `/learn/[slug]` system guide and its link text. */
  readonly guide: { readonly slug: string; readonly label: string } | null
}

export interface ReadoutRow {
  readonly label: string
  readonly value: ReactNode
  readonly detail?: ReactNode
}

/** Slot 1: the mural as a band, then the centred head (BENTO_SITE.md "Heads"): eyebrow, title, lead, the picker. */
export function SystemPage({ spec, picker, children }: { readonly spec: SystemPageSpec; readonly picker?: ReactNode; readonly children: ReactNode }) {
  return (
    <article className={`${site.page} ${s.page}`} style={{ '--accent': spec.accent } as CSSProperties}>
      <header className={s.head}>
        <div className={s.banner}>
          <img src={spec.mural} alt="" className={s.bannerArt} fetchPriority="high" decoding="async" />
          <div className={s.bannerShade} aria-hidden />
        </div>
        <div className={site.sectionHead}>
          <div className={site.sectionTitle}>
            <span className={`${kit.eyebrow} ${s.eyebrow}`}>{spec.eyebrow}</span>
            <h1 className={site.display}>{spec.title}</h1>
          </div>
          <p className={site.lead}>{spec.lead}</p>
          {picker && <div className={site.pageHeadBelow}>{picker}</div>}
        </div>
      </header>
      {children}
    </article>
  )
}

/** Slots 2 to 5: the figure across the full width; readout, gate and note in a row under it. */
export function SystemGrid({ spec, figure, side }: { readonly spec: SystemPageSpec; readonly figure: ReactNode; readonly side?: ReactNode }) {
  return (
    <div className={s.grid}>
      <div style={{ minWidth: 0 }}>{figure}</div>
      <div className={s.side}>
        {side}
        <LayerNote spec={spec} />
      </div>
    </div>
  )
}

export function FigureCard({ label, actions, children }: { readonly label: string; readonly actions?: ReactNode; readonly children: ReactNode }) {
  return (
    <section className={`${site.card} ${s.figure}`} aria-label={label}>
      {actions && <div className={s.figureHead}>{actions}</div>}
      {children}
    </section>
  )
}

/** Slot 3: values as text, hairline rows. */
export function Readout({ title, rows, head, columns = false }: { readonly title: string; readonly rows: readonly ReadoutRow[]; readonly head?: ReactNode; readonly columns?: boolean }) {
  return (
    <section className={site.card} aria-label={title} style={head ? { display: 'grid', gap: 16 } : undefined}>
      {head}
      <dl className={`${s.readout} ${columns ? s.readoutCols : ''}`}>
        {rows.map((r) => (
          <div key={r.label} className={s.row}>
            <dt>{r.label}</dt>
            <dd>
              <span>{r.value}</span>
              {r.detail && <span className={s.detail}>{r.detail}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Slot 5: what the layer reads, and where to read more. */
export function LayerNote({ spec }: { readonly spec: SystemPageSpec }) {
  return (
    <aside className={s.note} aria-label="What this layer reads">
      <span className={kit.eyebrow}>What this layer reads</span>
      <p>{spec.reads}</p>
      {(spec.article || spec.guide) && (
        <div className={s.links}>
          {spec.article && (
            <Link href={siteHref(`/app/library/${spec.article}`)} className={kit.pill}>
              <BookOpen size={14} aria-hidden />
              Library article
            </Link>
          )}
          {spec.guide && (
            <Link href={siteHref(`/learn/${spec.guide.slug}`)} className={kit.pill}>
              {spec.guide.label}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      )}
    </aside>
  )
}

/** A titled block under the grid. */
export function SystemSection({ id, title, lead, actions, children }: { readonly id: string; readonly title: string; readonly lead?: ReactNode; readonly actions?: ReactNode; readonly children: ReactNode }) {
  return (
    <section className={s.section} aria-labelledby={`${id}-title`}>
      <div className={s.sectionHead}>
        <div>
          <h2 id={`${id}-title`} className={site.h3}>
            {title}
          </h2>
          {lead && <p>{lead}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Pick one of a few options; each option is a pressed or released button. */
export function Segmented<T extends string>({ label, options, value, onChange }: { readonly label: string; readonly options: readonly { readonly id: T; readonly label: string }[]; readonly value: T; readonly onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className={s.segmented}>
      {options.map((o) => (
        <button key={o.id} type="button" className={s.segment} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Label above a native select. */
export function SelectField<T extends string>({ id, label, value, options, onChange }: { readonly id: string; readonly label: string; readonly value: T; readonly options: readonly { readonly value: T; readonly label: string }[]; readonly onChange: (value: T) => void }) {
  return (
    <div className={s.picker}>
      <label htmlFor={id} className={site.label}>
        {label}
      </label>
      <div className={s.selectWrap}>
        <select id={id} className={s.select} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={s.selectIcon} aria-hidden />
      </div>
    </div>
  )
}

const personLabel = (p: SavedPerson): string => (p.person.is_self ? `${p.person.name} (you)` : p.person.name)

/** The saved people as a select, the account's own person first by default. */
export function PersonPicker({ id = 'person', label = 'Whose map', people, value, onChange }: { readonly id?: string; readonly label?: string; readonly people: readonly SavedPerson[]; readonly value: string | null; readonly onChange: (id: string) => void }) {
  if (people.length === 0 || value === null) return null
  return <SelectField id={id} label={label} value={value} options={people.map((p) => ({ value: p.person.id, label: personLabel(p) }))} onChange={onChange} />
}

/** Placeholders shaped like the figure and the readout. */
export function GridSkeleton({ spec, rows = 6 }: { readonly spec: SystemPageSpec; readonly rows?: number }) {
  return (
    <Loading label={`Loading ${spec.title}`}>
      <SystemGrid
        spec={spec}
        figure={
          <div className={`${site.card} ${s.figure}`}>
            <Skeleton width="40%" height={20} />
            <Skeleton height={280} />
          </div>
        }
        side={
          <div className={site.card} style={{ display: 'grid', gap: 14 }}>
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14 }}>
                <Skeleton height={14} />
                <Skeleton height={14} width={`${60 + ((i * 17) % 35)}%`} />
              </div>
            ))}
          </div>
        }
      />
    </Loading>
  )
}

/** Slot 4: the locked state names the plan that opens the system. */
export function PlanGate({ spec, opensOn, planName }: { readonly spec: SystemPageSpec; readonly opensOn: PlanId | null; readonly planName: string }) {
  const opens = opensOn ? PLANS[opensOn].name : null
  return (
    <div className={s.gate}>
      <span className={kit.eyebrow}>{opens ? `Opens on ${opens}` : 'Not in a plan yet'}</span>
      <h2 className={site.h3}>{spec.title} is a paid reading</h2>
      <p className={site.body}>
        Your account is on {planName}. Saved people stay as they are; the reading appears here once the plan includes it.
      </p>
      <PrimaryAction href={`${siteHref('/app/settings')}#plan`} size="small">
        See plans
      </PrimaryAction>
    </div>
  )
}

const addPeopleLink = () => (
  <PrimaryAction href={siteHref('/app/people')} intent="add" size="small">
    Add a person
  </PrimaryAction>
)

/** Shown when the person on screen lacks the birth data the system needs. */
export function MissingBirthData({ spec, person, missing }: { readonly spec: SystemPageSpec; readonly person: SavedPerson; readonly missing: readonly MissingField[] }) {
  const { id, name } = person.person
  return (
    <EmptyState
      title={`${spec.title} needs more of ${name}'s birth data`}
      action={
        <Link href={siteHref(`/app/people/${id}`)} className={`${site.btn} ${site.btnSmall}`}>
          Open {name}
        </Link>
      }
    >
      {missing.map((m) => MISSING_LABEL[m]).join('. ')}. Add it to the record and this page reads it.
    </EmptyState>
  )
}

/**
 * Every state a person-bound system page can be in except ready: loading,
 * locked, error and no saved people. `ready` renders the page's own grid.
 */
export function SystemState({ spec, status, rows, ready }: { readonly spec: SystemPageSpec; readonly status: SystemStatus; readonly rows?: number; readonly ready: (selected: SavedPerson) => ReactNode }) {
  switch (status.kind) {
    case 'loading':
      return <GridSkeleton spec={spec} rows={rows} />
    case 'locked':
      return <SystemGrid spec={spec} figure={<PlanGate spec={spec} opensOn={status.opensOn} planName={status.planName} />} />
    case 'error':
      return (
        <SystemGrid
          spec={spec}
          figure={
            <ErrorState
              title="Your people did not load"
              action={
                <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={status.retry}>
                  Try again
                </button>
              }
            >
              {status.message}
            </ErrorState>
          }
        />
      )
    case 'no-people':
      return (
        <SystemGrid
          spec={spec}
          figure={
            <EmptyState title="No saved people yet" action={addPeopleLink()}>
              {spec.title} reads a saved person&rsquo;s birth data. Add yourself or someone close, then come back.
            </EmptyState>
          }
        />
      )
    case 'ready':
      return <>{ready(status.selected)}</>
  }
}
