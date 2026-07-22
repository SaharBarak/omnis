/**
 * Dark v2 shell + primitives for the /learn/[system] doc pages, following
 * the landing-v2 grammar: MURAL_GROUND, NavV2/FooterV2, TYPE ramp,
 * `bg-surface` cards, per-system flavor accents.
 *
 * DocHero lives beside this shell and is re-exported here so pages import
 * the whole doc kit from one place. The legacy light-theme doc/landing
 * components were deleted once the last page ported off them.
 */

import Link from 'next/link'

import { NavV2, FooterV2, StarParallax } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import {
  DOC_FLAVORS,
  FLAVOR_DESCENT,
  MURAL_GROUND,
  SYSTEM_FLAVORS,
  type DocSectionId,
} from '@/lib/design/system-flavors'
import { getFooterLiveLine, getTodayAcrossSystems } from '@/lib/today-board'

import { DocToc, DocTocInline, type TocItem } from './doc-toc'

export { DocHero } from './doc-hero'
export type { TocItem } from './doc-toc'

/** The one card surface for doc content — no ad-hoc card styles. */
export const CARD = 'rounded-2xl border border-white/10 bg-surface'

/** Same guide order as the /learn index: the mural descent, then integration. */
const GUIDE_ORDER: readonly DocSectionId[] = [
  ...FLAVOR_DESCENT.map(
    (key) => SYSTEM_FLAVORS[key].learnHref.replace('/learn/', '') as DocSectionId,
  ),
  'integration',
]

/** Mono-eyebrow strip: back to the knowledge base + the six guides. */
function GuideStrip({ current }: { readonly current: DocSectionId }) {
  return (
    <nav
      aria-label="Knowledge base guides"
      className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2"
    >
      <Link
        href="/learn"
        className={`${TYPE.eyebrow} text-white/35 transition-colors hover:text-white`}
      >
        &larr; Knowledge base
      </Link>
      <span aria-hidden className="hidden h-3 w-px bg-white/10 sm:block" />
      {GUIDE_ORDER.map((id) => {
        const flavor = DOC_FLAVORS[id]
        const isCurrent = id === current
        return (
          <Link
            key={id}
            href={`/learn/${id}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={`${TYPE.eyebrow} transition-colors ${
              isCurrent ? '' : 'text-white/35 hover:text-white'
            }`}
            style={isCurrent ? { color: flavor.accentSoft } : undefined}
          >
            {flavor.name}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Full-page shell: ground, nav, star field, centered prose column, footer.
 *
 * Pass `toc` (the page's DocSection headings) to get a sticky rail beside the
 * article on xl+ and a collapsed jump list under the guide strip below that.
 * Prev/next navigation is derived from GUIDE_ORDER and rendered after the
 * page content — pages never declare their own ordering.
 */
export function DocShell({
  section,
  toc,
  children,
}: {
  readonly section: DocSectionId
  readonly toc?: readonly TocItem[]
  readonly children: React.ReactNode
}) {
  const liveLine = getFooterLiveLine(getTodayAcrossSystems())
  const hasToc = toc !== undefined && toc.length > 0

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        <div className="relative mx-auto max-w-content px-6">
          <div
            className={
              hasToc ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12' : undefined
            }
          >
            <article className="mx-auto w-full min-w-0 max-w-3xl">
              <GuideStrip current={section} />
              {hasToc && <DocTocInline items={toc} />}
              {children}
              <DocNav current={section} />
            </article>

            {hasToc && (
              <aside className="hidden xl:block">
                {/* The column stretches with the article; only this wrapper sticks. */}
                <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto">
                  <DocToc items={toc} accentSoft={DOC_FLAVORS[section].accentSoft} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      <FooterV2 liveLine={liveLine} />
    </div>
  )
}

type ProseBlock =
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'ul'; readonly items: readonly string[] }

const BULLET = /^-\s+/

/**
 * Parse a raw content.ts template literal into paragraphs and bullet lists.
 *
 * Blank lines separate paragraphs; `- ` lines become list items (blank lines
 * between bullets keep one list, and wrapped bullet lines continue their item).
 */
function parseProse(raw: string): readonly ProseBlock[] {
  const blocks: ProseBlock[] = []
  let paragraph: string[] = []
  let items: string[][] = []
  let listInterrupted = false

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const flushList = () => {
    if (items.length > 0) {
      blocks.push({ kind: 'ul', items: items.map((lines) => lines.join(' ')) })
      items = []
    }
    listInterrupted = false
  }

  for (const line of raw.split('\n').map((l) => l.trim())) {
    if (line === '') {
      flushParagraph()
      listInterrupted = items.length > 0
    } else if (BULLET.test(line)) {
      flushParagraph()
      items.push([line.replace(BULLET, '')])
      listInterrupted = false
    } else if (items.length > 0 && !listInterrupted) {
      // Wrapped continuation of the previous bullet.
      items[items.length - 1].push(line)
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()

  return blocks
}

const PROSE_TONE = {
  /** Section-lead grammar. */
  lead: 'text-lg leading-relaxed text-white/70',
  /** In-card small grammar. */
  small: 'text-sm leading-relaxed text-white/70',
  /** No tone of its own — inherits from the wrapper (e.g. DocInfoBox). */
  inherit: '',
} as const

/**
 * Renders a raw multi-line content.ts string as real prose: blank-line-split
 * paragraphs and proper <ul> bullets instead of one flattened <p>.
 */
export function DocProse({
  content,
  variant = 'lead',
  className = '',
}: {
  readonly content: string
  readonly variant?: keyof typeof PROSE_TONE
  readonly className?: string
}) {
  return (
    <div className={`space-y-4 ${PROSE_TONE[variant]} ${className}`.trim()}>
      {parseProse(content).map((block, i) =>
        block.kind === 'ul' ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-white/30">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.text}</p>
        ),
      )}
    </div>
  )
}

/** Section wrapper: TYPE.section h2 with a stable anchor id. */
export function DocSection({
  id,
  title,
  children,
}: {
  readonly id: string
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <section className="mb-16 sm:mb-20">
      <h2 id={id} className={`${TYPE.section} mb-6 scroll-mt-32`}>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Small-caps h3 subhead (TYPE.h3), optionally anchorable. */
export function DocH3({
  id,
  children,
}: {
  readonly id?: string
  readonly children: React.ReactNode
}) {
  return (
    <h3 id={id} className={`${TYPE.h3} mb-4 mt-10 scroll-mt-32`}>
      {children}
    </h3>
  )
}

/** SEO quick-answer block — keeps the schema.org Question/Answer microdata. */
export function QuickAnswer({
  question,
  answer,
  accent,
  accentSoft,
}: {
  readonly question: string
  readonly answer: string
  readonly accent: string
  readonly accentSoft: string
}) {
  return (
    <section
      className={`${CARD} mb-12 p-6 sm:p-8`}
      style={{ borderLeftWidth: '3px', borderLeftColor: accent }}
      itemScope
      itemType="https://schema.org/Question"
    >
      <div className={TYPE.eyebrow} style={{ color: accentSoft }}>
        Quick answer
      </div>
      <h2 className="mb-3 mt-2 font-display text-lg text-white" itemProp="name">
        {question}
      </h2>
      <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
        <p className="text-sm leading-relaxed text-white/70" itemProp="text">
          {answer}
        </p>
      </div>
    </section>
  )
}

/** Quick-stats tiles: accent value, mono label. */
export function DocStats({
  stats,
  accentSoft,
}: {
  readonly stats: readonly { readonly value: string | number; readonly label: string }[]
  readonly accentSoft: string
}) {
  return (
    <div className="my-10 grid grid-cols-2 gap-3 sm:my-12 sm:grid-cols-4 sm:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`${CARD} p-5`}>
          <div
            className="font-display text-2xl font-semibold md:text-3xl"
            style={{ color: accentSoft }}
          >
            {stat.value}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Accent-edged info box on the shared card surface. */
export function DocInfoBox({
  title,
  accent,
  accentSoft,
  children,
}: {
  readonly title?: string
  readonly accent: string
  readonly accentSoft: string
  readonly children: React.ReactNode
}) {
  return (
    <div
      className={`${CARD} p-6`}
      style={{ borderLeftWidth: '3px', borderLeftColor: `${accent}99` }}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span className="font-medium" style={{ color: accentSoft }}>
            {title}
          </span>
        </div>
      )}
      <div className="text-sm leading-relaxed text-white/70">{children}</div>
    </div>
  )
}

/** Pull quote — same figure grammar as the /learn index voices. */
export function DocPullQuote({
  quote,
  author,
  accent,
}: {
  readonly quote: string
  readonly author?: string
  readonly accent: string
}) {
  return (
    <figure className="my-12">
      <blockquote className="text-xl leading-relaxed text-white/90 sm:text-2xl">
        &ldquo;{quote}&rdquo;
      </blockquote>
      {author && (
        <figcaption className="mt-4 flex items-center gap-4">
          <span
            aria-hidden
            className="h-px w-10"
            style={{ backgroundColor: `${accent}66` }}
          />
          <cite className="text-sm not-italic text-white/50">{author}</cite>
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Prev / next guide navigation, derived from GUIDE_ORDER so every page walks
 * the same descent the /learn index displays. Rendered by DocShell — pages
 * don't place (or reorder) it themselves.
 */
function DocNav({ current }: { readonly current: DocSectionId }) {
  const index = GUIDE_ORDER.indexOf(current)
  const toLink = (id: DocSectionId) => ({
    href: `/learn/${id}`,
    title: DOC_FLAVORS[id].name,
  })
  const prev = index > 0 ? toLink(GUIDE_ORDER[index - 1]) : undefined
  const next =
    index !== -1 && index < GUIDE_ORDER.length - 1
      ? toLink(GUIDE_ORDER[index + 1])
      : undefined

  return (
    <nav className="mt-16 flex items-center justify-between gap-6 border-t border-white/10 pt-8">
      {prev ? (
        <Link href={prev.href} className="group min-w-0">
          <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
            Previous
          </span>
          <span className="mt-1 flex items-center gap-2 font-display text-lg text-white/70 transition-colors group-hover:text-white">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link href={next.href} className="group min-w-0 text-right">
          <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
            Next
          </span>
          <span className="mt-1 flex items-center justify-end gap-2 font-display text-lg text-white/70 transition-colors group-hover:text-white">
            {next.title}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}

/** End-of-guide CTA, mirroring the /learn index CTA button grammar. */
export function DocCta({
  title,
  body,
  primary,
  secondary,
}: {
  readonly title: string
  readonly body: string
  readonly primary: { readonly href: string; readonly label: string }
  readonly secondary?: { readonly href: string; readonly label: string }
}) {
  return (
    <section className={`${CARD} mt-16 p-8 text-center sm:p-10`}>
      <h3 className="font-display text-2xl font-medium text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-white/50">{body}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={primary.href}
          className="inline-flex items-center justify-center rounded-xl bg-brand px-8 py-4 font-medium text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
        >
          {primary.label}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-8 py-4 font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white active:scale-[0.98]"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </section>
  )
}

/**
 * Tinted chip for raw seal/tone/glyph images so they never sit naked on the
 * ground (same treatment as the ego-star map nodes).
 */
export function GlyphChip({
  accent,
  className = '',
  children,
}: {
  readonly accent: string
  readonly className?: string
  readonly children: React.ReactNode
}) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-xl border p-1.5 ${className}`}
      style={{ backgroundColor: `${accent}14`, borderColor: `${accent}33` }}
    >
      {children}
    </span>
  )
}
