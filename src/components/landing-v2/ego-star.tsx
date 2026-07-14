'use client'

import { forwardRef, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { SealIcon } from '@/components/cards/SealIcon'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, type SystemKey } from '@/lib/design/system-flavors'
import { COLORS } from '@/lib/design/landing-tokens'
import type {
  EgoStarData,
  EgoSpoke,
  OracleSlot,
  DemoTie,
} from '@/lib/data/homepage-demo'

// ============================================================================
// THE ORACLE OF PEOPLE — the hero map, with layers.
//
// The cross is the Dreamspell oracle: guide above, analog right, antipode left,
// occult below, the ego at center — the arrangement this app already uses for a
// single kin (components/cards/OracleMap.tsx). Someone who shares your seal has
// no arm; they orbit the center, dashed.
//
// LAYERS. Each of the five systems has its own opinion about each pair. Selecting
// several does NOT draw several lines — one person is one arm. Agreement shows as
// beads; the loudest system colours the arm. A system with nothing to say about a
// pair contributes nothing at all — the gap is the finding.
//
// Layout always follows Dreamspell, even when that layer is off. Position is
// the oracle; it is not a free parameter.
//
// Everything visible is a fact off the engine:
//   where a person sits    → the kin relation the engine named
//   their icon             → their own Dreamspell seal glyph
//   an arm's thickness     → bits: how much this pair actually tells you
//   an arm's colour        → the system whose tie is most surprising
//   the beads on its pill  → the other systems that also found something
//   the rarity             → information content of the pair's ties (−log₂ base rate)
// ============================================================================

/** The oracle cross, in percentages of the canvas. Center is the ego. */
const SLOT_POS: Record<OracleSlot | 'center', { x: number; y: number }> = {
  top: { x: 50, y: 14 },
  right: { x: 85, y: 50 },
  left: { x: 15, y: 50 },
  bottom: { x: 50, y: 86 },
  orbit: { x: 78, y: 17 },
  center: { x: 50, y: 50 },
}

/** A caption hangs on the far side of its person, so it never falls into its own arm. */
const CAPTION_ABOVE: Partial<Record<OracleSlot | 'center', boolean>> = { top: true }

/** Where the relation pill sits on its arm: how far out, and how far off the line. */
const PILL: Record<OracleSlot, { t: number; dx: number }> = {
  top: { t: 0.72, dx: -13 },
  bottom: { t: 0.72, dx: 13 },
  left: { t: 0.52, dx: 0 },
  right: { t: 0.52, dx: 0 },
  orbit: { t: 0.58, dx: 0 },
}

const relationLabel = (type: string): string => type.replace(/-/g, ' ').toUpperCase()

/**
 * Which system speaks for this arm: the one whose tie is most *surprising*.
 *
 * Not the first in some fixed order — that would let Human Design's
 * `electromagnetic` (true of 95% of humanity) shout over a Dreamspell `guide`
 * (true of 0.4%). Bits decide. See packages/engine/src/services/rarity.ts.
 */
function leadSystem(spoke: EgoSpoke, found: readonly SystemKey[]): SystemKey {
  return found.reduce((best, k) =>
    (spoke.bySystem[k]?.bits ?? 0) > (spoke.bySystem[best]?.bits ?? 0) ? k : best,
  )
}

/** The map's default layer. Dreamspell is the one that draws the cross. */
const DEFAULT_LAYERS: readonly SystemKey[] = ['dreamspell']

interface EgoStarProps {
  readonly data: EgoStarData
  /**
   * A preview, not the instrument: no layer chips, no hover strip, no captions
   * beyond the name, and smaller glyphs. The full star assumes ~820px of canvas
   * and positions people at absolute percentages; squeezed into a half-column it
   * piles them on top of each other, which is exactly what it did.
   */
  readonly compact?: boolean
  readonly className?: string
}

export function EgoStar({ data, compact = false, className }: EgoStarProps) {
  const { center, spokes } = data
  const [layers, setLayers] = useState<readonly SystemKey[]>(DEFAULT_LAYERS)
  const [hovered, setHovered] = useState<EgoSpoke | null>(null)
  const [card, setCard] = useState<'center' | string | null>(null)
  /**
   * Hide ties that fire on nearly everybody. A tie under 1 bit is true of >50%
   * of all pairs — it is not evidence about these two. Off by default so the
   * map is honest about what it's suppressing, but one right-click away.
   */
  const [hideNoise, setHideNoise] = useState(false)

  /** The systems that found something worth showing about this pair. */
  const systemsFor = (spoke: EgoSpoke): readonly SystemKey[] =>
    active.filter((k) => {
      const t = spoke.bySystem[k]
      return t && (!hideNoise || t.bits >= 1)
    })

  // Keep layers in FLAVOR_DESCENT order however they were clicked, so a strand's
  // offset within a bundle is stable and the legend reads top-down.
  const active = useMemo(
    () => FLAVOR_DESCENT.filter((k) => layers.includes(k)),
    [layers],
  )

  const toggle = (key: SystemKey) =>
    setLayers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const allOn = active.length === FLAVOR_DESCENT.length
  const c = SLOT_POS.center

  const shownCard =
    card === 'center'
      ? { name: center.person.name, reading: center.reading }
      : spokes.find((s) => s.person.id === card) ?? null

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* ---- Layer selection. The chips are the legend. ---- */}
      {!compact && (
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {FLAVOR_DESCENT.map((key) => {
          const flavor = SYSTEM_FLAVORS[key]
          const on = active.includes(key)
          // accentSoft — Tzolkin's accent is unreadable on the near-black ground.
          const accent = flavor.accentSoft
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={on}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition active:scale-[0.98]"
              style={{
                borderColor: on ? `${accent}88` : 'rgba(255,255,255,0.12)',
                backgroundColor: on ? `${flavor.accent}1F` : 'transparent',
                color: on ? accent : 'rgba(255,255,255,0.45)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? accent : 'rgba(255,255,255,0.25)' }}
              />
              {flavor.name}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setLayers(allOn ? DEFAULT_LAYERS : FLAVOR_DESCENT)}
          className="rounded-full border border-dashed px-3 py-1.5 text-[11px] transition active:scale-[0.98]"
          style={{
            borderColor: allOn ? `${COLORS.brand}88` : 'rgba(255,255,255,0.18)',
            color: allOn ? COLORS.brandSoft : 'rgba(255,255,255,0.5)',
            backgroundColor: allOn ? `${COLORS.brand}14` : 'transparent',
          }}
        >
          {allOn ? 'Reset to Dreamspell' : 'Consolidate all five'}
        </button>
      </div>
      )}

      <ContextMenu>
        <ContextMenuTrigger asChild>
      <div
        className={`relative mx-auto w-full ${compact ? 'aspect-square max-w-[300px]' : 'aspect-[16/11] max-w-[820px]'}`}
      >
        {/* ------------------------------------------------------------------
            ONE LINE PER PERSON. Never a bundle.

            Fanning a strand per system produced hatching, not connections: the
            perpendicular offset was computed in a viewBox stretched by
            preserveAspectRatio="none", so every strand sheared off its own arm.
            And a pile of parallel lines says "five systems agree" no louder than
            one line does — it just costs the reader five times the work.

            So: one arm, and the three things that vary carry the meaning.
              thickness → total bits (how much this pair actually tells you)
              colour    → the system that found the most surprising tie
              beads     → one dot per OTHER selected system that also found one
           ------------------------------------------------------------------ */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {spokes.map((spoke) => {
            const p = SLOT_POS[spoke.slot]
            const on = hovered?.person.id === spoke.person.id
            const dim = hovered !== null && !on

            const found = systemsFor(spoke)
            if (found.length === 0) return null

            const lead = leadSystem(spoke, found)
            const accent = SYSTEM_FLAVORS[lead].accentSoft

            // Weight of the arm = what the pair says, in bits. Not decoration.
            const bits = found.reduce((sum, k) => sum + (spoke.bySystem[k]?.bits ?? 0), 0)
            const width = Math.max(0.9, Math.min(3.4, 0.7 + bits * 0.28))

            return (
              <motion.line
                key={spoke.person.id}
                x1={c.x}
                y1={c.y}
                x2={p.x}
                y2={p.y}
                stroke={accent}
                strokeWidth={on ? width + 1 : width}
                strokeOpacity={dim ? 0.18 : 0.9}
                strokeLinecap="round"
                // The orbit is not an arm of the cross — the line says so.
                strokeDasharray={spoke.slot === 'orbit' ? '4 4' : undefined}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            )
          })}
        </svg>

        {/* ---- What the engine named, and who else agrees. ---- */}
        {!compact && spokes.map((spoke) => {
          const p = SLOT_POS[spoke.slot]
          const { t, dx } = PILL[spoke.slot]
          const on = hovered?.person.id === spoke.person.id
          const found = systemsFor(spoke)
          if (found.length === 0) return null

          const lead = leadSystem(spoke, found)
          const leadTie = spoke.bySystem[lead]!
          const accent = SYSTEM_FLAVORS[lead].accentSoft
          const others = found.filter((k) => k !== lead)

          return (
            <span
              key={`label-${spoke.person.id}`}
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                left: `${c.x + (p.x - c.x) * t + dx}%`,
                top: `${c.y + (p.y - c.y) * t}%`,
                color: accent,
                borderColor: `${accent}${on ? 'cc' : '55'}`,
                backgroundColor: COLORS.surface2,
                opacity: hovered && !on ? 0.35 : 1,
              }}
            >
              {/* Always the relation the engine actually named — never "3 layers",
                  which named nothing and made the reader hunt for it. */}
              {relationLabel(leadTie.type)}

              {/* One bead per other system that also found something. Agreement,
                  shown once, instead of restated as another whole line. */}
              {others.length > 0 && (
                <span className="flex items-center gap-[3px]">
                  {others.map((k) => (
                    <span
                      key={k}
                      className="h-[5px] w-[5px] rounded-full"
                      style={{ backgroundColor: SYSTEM_FLAVORS[k].accentSoft }}
                    />
                  ))}
                </span>
              )}
            </span>
          )
        })}

        {/* The ego */}
        <Person
          name={center.person.name}
          seal={center.seal}
          sealName={center.sealName}
          kin={center.kin}
          color={center.color}
          pos={c}
          isCenter
          compact={compact}
          dimmed={false}
          onClick={() => setCard(card === 'center' ? null : 'center')}
        />

        {/* The four arms + the orbit. Each person carries their own menu. */}
        {spokes.map((spoke, i) => (
          <ContextMenu key={spoke.person.id}>
            <ContextMenuTrigger asChild>
              <Person
                name={spoke.person.name}
                seal={spoke.seal}
                sealName={spoke.sealName}
                kin={spoke.kin}
                color={spoke.color}
                pos={SLOT_POS[spoke.slot]}
                rarity={spoke.rarity}
                compact={compact}
                captionAbove={CAPTION_ABOVE[spoke.slot] ?? false}
                delay={0.3 + i * 0.08}
                dimmed={hovered !== null && hovered.person.id !== spoke.person.id}
                onHover={(on) => setHovered(on ? spoke : null)}
                onClick={() => setCard(card === spoke.person.id ? null : spoke.person.id)}
              />
            </ContextMenuTrigger>

            <ContextMenuContent className="w-72">
              <ContextMenuLabel className="flex items-baseline justify-between gap-3">
                <span>{spoke.person.name}</span>
                <span className="font-mono text-[10px] font-normal text-muted-foreground">
                  Kin {spoke.kin} · {spoke.sealName}
                </span>
              </ContextMenuLabel>
              <ContextMenuSeparator />

              <ContextMenuItem
                onSelect={() => setCard(card === spoke.person.id ? null : spoke.person.id)}
              >
                {card === spoke.person.id ? 'Hide' : 'Read'} the five-system chart
              </ContextMenuItem>

              {/* What each system ACTUALLY says about this pair, with the
                  honest denominator next to it. This is the whole product in
                  one menu: named relations, and how rare they really are. */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  How {center.person.name} connects to {spoke.person.name}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-72">
                  {FLAVOR_DESCENT.map((k) => {
                    const t = spoke.bySystem[k]
                    return (
                      <ContextMenuItem key={k} disabled className="justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: SYSTEM_FLAVORS[k].accentSoft }}
                          />
                          <span className="capitalize">
                            {t ? t.type.replace(/-/g, ' ') : 'nothing found'}
                          </span>
                        </span>
                        {t && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            1 in {Math.max(1, Math.round(1 / t.baseRate))}
                          </span>
                        )}
                      </ContextMenuItem>
                    )
                  })}
                  <ContextMenuSeparator />
                  <ContextMenuItem disabled className="justify-between">
                    <span>Rarity of this pairing</span>
                    <span className="font-mono text-[10px]">{spoke.rarity} / 100</span>
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSeparator />

              <ContextMenuItem
                onSelect={() => {
                  void navigator.clipboard?.writeText(
                    `${spoke.person.name} — Kin ${spoke.kin} (${spoke.sealName}), born ${spoke.person.birthDate}. ` +
                      `${center.person.name}'s ${spoke.tie.type.replace(/-/g, ' ')}.`,
                  )
                }}
              >
                Copy their signature
              </ContextMenuItem>

              <ContextMenuItem asChild>
                <Link href="/calculate">Open a full reading</Link>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Five-system reading for whoever was tapped */}
        {shownCard && (
          <motion.div
            className="absolute right-0 top-0 z-10 w-56 rounded-xl border border-white/10 bg-surface-2 p-4 shadow-2xl"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-base text-white">
                {'person' in shownCard ? shownCard.person.name : shownCard.name}
              </p>
              <button
                type="button"
                aria-label="Close"
                className="text-white/50 transition-colors hover:text-white"
                onClick={() => setCard(null)}
              >
                ×
              </button>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">
              Five-system reading
            </p>
            <div className="mt-3 space-y-1.5">
              {FLAVOR_DESCENT.map((key, i) => (
                <div key={key} className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: SYSTEM_FLAVORS[key].accent }}
                  >
                    {SYSTEM_FLAVORS[key].name}
                  </span>
                  <span className="text-right font-mono text-[11px] text-white/90">
                    {shownCard.reading[i]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
        </ContextMenuTrigger>

        {/* Right-click the canvas: control what the map is allowed to draw. */}
        <ContextMenuContent className="w-64">
          <ContextMenuLabel>Layers</ContextMenuLabel>
          {FLAVOR_DESCENT.map((key) => (
            <ContextMenuCheckboxItem
              key={key}
              checked={active.includes(key)}
              onCheckedChange={() => toggle(key)}
            >
              <span
                className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: SYSTEM_FLAVORS[key].accentSoft }}
              />
              {SYSTEM_FLAVORS[key].name}
            </ContextMenuCheckboxItem>
          ))}

          <ContextMenuSeparator />

          <ContextMenuItem onSelect={() => setLayers(FLAVOR_DESCENT)} disabled={allOn}>
            Consolidate all five
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => setLayers(DEFAULT_LAYERS)}
            disabled={active.length === 1 && active[0] === 'dreamspell'}
          >
            Reset to Dreamspell
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* The control the surprisal data makes possible. */}
          <ContextMenuCheckboxItem checked={hideNoise} onCheckedChange={setHideNoise}>
            Hide near-universal ties
            <ContextMenuShortcut>&lt;1 bit</ContextMenuShortcut>
          </ContextMenuCheckboxItem>
          <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
            A tie under 1 bit is true of more than half of all pairs — it says
            nothing about these two.
          </p>
        </ContextMenuContent>
      </ContextMenu>

      {/* Every selected layer's verdict on the hovered pair, side by side. */}
      {!compact && (
      <div className="mt-6 min-h-[54px]">
        {hovered ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {systemsFor(hovered)
              .map((k) => {
                const tie = hovered.bySystem[k] as DemoTie
                const accent = SYSTEM_FLAVORS[k].accentSoft
                return (
                  <span
                    key={k}
                    className="rounded-lg border px-2.5 py-1 text-[11px]"
                    style={{ borderColor: `${accent}44`, color: accent }}
                    title={tie.meaning}
                  >
                    <span className="uppercase tracking-wider">{SYSTEM_FLAVORS[k].name}</span>
                    <span className="mx-1.5 text-white/25">·</span>
                    <span className="capitalize text-white/80">
                      {tie.type.replace(/-/g, ' ')}
                      {tie.channel ? ` ${tie.channel}` : ''}
                    </span>
                    {/* How rare is this, really? The honest denominator. */}
                    <span className="ml-1.5 font-mono text-white/35">
                      1 in {Math.max(1, Math.round(1 / tie.baseRate))}
                    </span>
                  </span>
                )
              })}
            <p className="w-full text-center text-xs text-white/45">
              {center.person.name} → {hovered.person.name}: {hovered.tie.meaning}
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-white/35">
            Hover a person to see what each selected layer says about them.
          </p>
        )}
      </div>
      )}

      {!compact && (
        <p className="mt-2 text-center text-xs text-white/40">
          The Dreamspell oracle, drawn with people — guide above, analog right, antipode left,
          occult below. The cross sets position; the layers set the strands.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface PersonProps {
  readonly name: string
  readonly seal: number
  readonly sealName: string
  readonly kin: number
  readonly color: string
  readonly pos: { x: number; y: number }
  /**
   * How unusual this pairing is (information content of its ties), 0-100.
   * Absent on the ego — she has no tie to herself. This is NOT a "compatibility"
   * number: nothing in these traditions licenses "good".
   */
  readonly rarity?: number
  readonly isCenter?: boolean
  /** Preview sizing: smaller glyph, name only, no kin/rarity lines. */
  readonly compact?: boolean
  readonly captionAbove?: boolean
  readonly dimmed: boolean
  readonly delay?: number
  readonly onHover?: (on: boolean) => void
  readonly onClick?: () => void
}

/**
 * A person on the map: their own seal glyph, their name, their kin.
 *
 * forwardRef because Radix's ContextMenuTrigger `asChild` needs to attach a ref
 * to the real DOM node — without it the right-click menu silently never opens.
 */
const Person = forwardRef<HTMLButtonElement, PersonProps>(function Person(
  {
    name,
    seal,
    sealName,
    kin,
    color,
    pos,
    rarity,
    isCenter = false,
    compact = false,
    captionAbove = false,
    dimmed,
    delay = 0,
    onHover,
    onClick,
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      {...rest}
      type="button"
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 transition-opacity ${
        captionAbove ? 'flex-col-reverse' : 'flex-col'
      }`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, opacity: dimmed ? 0.35 : 1 }}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: dimmed ? 0.35 : 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      onClick={onClick}
      aria-label={`${name} — kin ${kin}, ${sealName}${rarity !== undefined ? `, rarity ${rarity} of 100` : ''}`}
    >
      {/* The person's own Dreamspell seal glyph. Not an avatar — a datum. */}
      <span
        className="grid place-items-center rounded-full border-2 transition-transform hover:scale-105"
        style={{
          width: compact ? (isCenter ? 40 : 30) : isCenter ? 76 : 58,
          height: compact ? (isCenter ? 40 : 30) : isCenter ? 76 : 58,
          backgroundColor: `${color}22`,
          borderColor: isCenter ? COLORS.brand : `${color}88`,
          boxShadow: isCenter ? `0 0 32px ${COLORS.brand}44` : undefined,
        }}
      >
        <SealIcon sealNumber={seal} size={compact ? 'xs' : isCenter ? 'lg' : 'md'} />
      </span>

      {/* Grouped so flipping the caption above/below never reorders these. */}
      <span className="flex flex-col items-center gap-1">
        <span
          className={
            compact
              ? `leading-none ${isCenter ? 'text-[10px] text-white' : 'text-[9px] text-white/70'}`
              : `leading-none ${isCenter ? 'text-[15px] text-white' : 'text-[13px] text-white/80'}`
          }
        >
          {name}
        </span>

        {/* The preview is a card, not the instrument — a name is all it can carry
            at this size without the labels colliding, which is what they did. */}
        {!compact && (
          <>
            <span className="whitespace-nowrap font-mono text-[10px] leading-none text-white/40">
              Kin {kin} · {sealName}
            </span>
            {rarity !== undefined && (
              <span className="whitespace-nowrap font-mono text-[10px] leading-none text-white/30">
                rarity {rarity}
              </span>
            )}
          </>
        )}
      </span>
    </motion.button>
  )
})
