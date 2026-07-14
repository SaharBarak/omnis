import Image from 'next/image'

import { DOC_FLAVORS, MURAL_GROUND, type DocSectionId } from '@/lib/design/system-flavors'

interface DocHeroProps {
  section: DocSectionId
  title: string
  subtitle: string
}

/**
 * Flavored hero band for /learn/[system] pages (DESIGN_LANGUAGE.md: docs are
 * the source of knowledge; each doc wears its system's folklore skin).
 *
 * A contained "codex plate": generated banner art, left scrim so the title
 * sits on quiet ground, system accent on the pill. Server component.
 */
export function DocHero({ section, title, subtitle }: DocHeroProps) {
  const flavor = DOC_FLAVORS[section]

  return (
    <header
      className="relative mb-12 overflow-hidden rounded-2xl border border-white/10 sm:mb-16"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      <Image
        src={flavor.bannerSrc}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 768px, 100vw"
        className="object-cover object-right"
      />
      {/* Left scrim — headline always sits on quiet ground. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${MURAL_GROUND}F2 0%, ${MURAL_GROUND}CC 45%, transparent 100%)`,
        }}
      />

      <div className="relative px-6 py-12 sm:px-10 sm:py-16">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ borderColor: `${flavor.accent}66`, color: flavor.accentSoft }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: flavor.accent }}
          />
          {flavor.name}
        </span>

        <h1 className="mt-5 max-w-2xl font-display font-semibold text-3xl leading-[1.08] tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </header>
  )
}
