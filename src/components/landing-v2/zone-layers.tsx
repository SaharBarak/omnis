'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, MURAL_GROUND } from '@/lib/design/system-flavors'
import { COLORS, TYPE } from '@/lib/design/landing-tokens'

// ============================================
// THE FIVE LAYERS — scroll-pinned signature set piece.
// The same six people stay fixed while scrolling stacks a translucent
// acetate layer per system, ending fused. Spec: HOMEPAGE_SPEC §7.
// ============================================

/**
 * The edges are REAL. `layerEdges` is computed by the engine on the server
 * (src/lib/data/homepage-demo.ts) and passed in — previously these were
 * hardcoded index pairs that encoded nothing, which is why the section read as
 * a meaningless network diagram.
 */
export interface LayerEdge {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  /** The engine's name for this tie — 'guide', 'electromagnetic', 'trine'… */
  readonly type: string
}

interface LayerPerson {
  readonly name: string
  readonly x: number
  readonly y: number
}

const LAYER_DASH = ['none', '1 6', '4 4', '10 3', '2 3'] as const

function Layer({
  index,
  progress,
  edges,
}: {
  readonly index: number
  readonly progress: MotionValue<number>
  readonly edges: readonly LayerEdge[]
}) {
  const flavor = SYSTEM_FLAVORS[FLAVOR_DESCENT[index]]
  // Layer i becomes visible in its scroll window and stays.
  const start = index / 6
  const opacity = useTransform(progress, [start, start + 0.09], [0, 1])

  return (
    <motion.g style={{ opacity }}>
      {edges.map((e, i) => (
        <line
          key={`${index}-${i}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke={flavor.accent}
          strokeWidth={1.6}
          strokeDasharray={LAYER_DASH[index]}
          opacity={0.8}
        >
          <title>{e.type}</title>
        </line>
      ))}
    </motion.g>
  )
}

export interface ZoneLayersProps {
  readonly people: readonly LayerPerson[]
  /** One edge list per system, in FLAVOR_DESCENT order. Engine-computed. */
  readonly layerEdges: readonly (readonly LayerEdge[])[]
}

export function ZoneLayers({ people, layerEdges }: ZoneLayersProps) {
  const PEOPLE = people
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Fused beat: after all five layers, everything brightens together.
  const fusedGlow = useTransform(scrollYProgress, [5 / 6, 1], [0, 0.07])
  const activeIndex = useTransform(scrollYProgress, (v) =>
    Math.min(Math.floor(v * 6), 5),
  )

  return (
    <section
      id="layers"
      ref={containerRef}
      className="relative"
      style={{ backgroundColor: MURAL_GROUND, height: reducedMotion ? 'auto' : '320vh' }}
    >
      <div
        className={
          reducedMotion
            ? 'py-28'
            : 'sticky top-0 flex min-h-[100dvh] flex-col justify-center py-16'
        }
      >
        <div className="mx-auto w-full max-w-content px-6">
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.18em]"
            style={{ borderColor: `${COLORS.brand}55`, color: COLORS.brand, backgroundColor: `${COLORS.brand}14` }}
          >
            Layer by layer
          </span>
          <h2 className={`${TYPE.zone} mt-6 max-w-3xl`}>
            Same people. Five layers deep.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            Every map and circle in Pleiad reads through one system at a time —
            the astrology layer, the dreamspell layer, the tzolkin, the design,
            the letters. Stack all five and read the whole truth at once.
          </p>

          {/* The acetate table */}
          <div className="relative mt-10 rounded-2xl border border-white/10 bg-surface p-4 md:p-8">
            {/* Layer chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {FLAVOR_DESCENT.map((key, i) => {
                const flavor = SYSTEM_FLAVORS[key]
                return (
                  <LayerChip
                    key={key}
                    label={flavor.name}
                    accent={flavor.accent}
                    index={i}
                    activeIndex={activeIndex}
                    forceActive={reducedMotion === true}
                  />
                )
              })}
              <LayerChip
                label="Fused"
                accent={COLORS.brand}
                index={5}
                activeIndex={activeIndex}
                forceActive={reducedMotion === true}
              />
            </div>

            <svg viewBox="0 0 800 460" className="h-auto w-full" role="img"
              aria-label="The same six people read through five stacked system layers">
              {/* Fused glow */}
              {reducedMotion ? (
                <rect x={0} y={0} width={800} height={460} fill={COLORS.brand} opacity={0.06} />
              ) : (
                <motion.rect
                  x={0}
                  y={0}
                  width={800}
                  height={460}
                  fill={COLORS.brand}
                  style={{ opacity: fusedGlow }}
                />
              )}

              {/* Five acetate layers — edges computed by the engine */}
              {FLAVOR_DESCENT.map((key, i) =>
                reducedMotion ? (
                  <g key={key} opacity={0.8}>
                    {(layerEdges[i] ?? []).map((e, j) => (
                      <line
                        key={`${i}-${j}`}
                        x1={e.x1}
                        y1={e.y1}
                        x2={e.x2}
                        y2={e.y2}
                        stroke={SYSTEM_FLAVORS[key].accent}
                        strokeWidth={1.6}
                        strokeDasharray={LAYER_DASH[i]}
                        opacity={0.7}
                      >
                        <title>{e.type}</title>
                      </line>
                    ))}
                  </g>
                ) : (
                  <Layer key={key} index={i} progress={scrollYProgress} edges={layerEdges[i] ?? []} />
                ),
              )}

              {/* The people — always present */}
              {PEOPLE.map((p) => (
                <g key={p.name}>
                  <circle cx={p.x} cy={p.y} r={16} fill="#ffffff" opacity={0.08} />
                  <circle cx={p.x} cy={p.y} r={8} fill={COLORS.brandSoft} stroke={MURAL_GROUND} strokeWidth={2} />
                  <text
                    x={p.x}
                    y={p.y + 28}
                    textAnchor="middle"
                    className="fill-white/70 text-[12px]"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <p className="mt-6 max-w-2xl text-sm text-white/50">
            Every line is a tie the engine actually found — a Guide kin, a
            completed channel, a Sun–Moon trine. Isolate one layer, compare two,
            or fuse all five into a single score. The evidence stays visible.
          </p>
        </div>
      </div>
    </section>
  )
}

function LayerChip({
  label,
  accent,
  index,
  activeIndex,
  forceActive,
}: {
  readonly label: string
  readonly accent: string
  readonly index: number
  readonly activeIndex: MotionValue<number>
  readonly forceActive: boolean
}) {
  const opacity = useTransform(activeIndex, (v) => (forceActive || v >= index ? 1 : 0.3))

  return (
    <motion.span
      className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest"
      style={{
        opacity,
        borderColor: `${accent}55`,
        color: accent,
        backgroundColor: `${accent}12`,
      }}
    >
      {label}
    </motion.span>
  )
}
