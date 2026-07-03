'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, MURAL_GROUND } from '@/lib/design/system-flavors'

// ============================================
// THE FIVE LAYERS — scroll-pinned signature set piece.
// The same six people stay fixed while scrolling stacks a translucent
// acetate layer per system, ending fused. Spec: HOMEPAGE_SPEC §7.
// ============================================

interface LayerPerson {
  readonly name: string
  readonly x: number
  readonly y: number
}

const PEOPLE: readonly LayerPerson[] = [
  { name: 'Maya', x: 180, y: 110 },
  { name: 'Noam', x: 420, y: 80 },
  { name: 'Dana', x: 610, y: 170 },
  { name: 'Ari', x: 250, y: 300 },
  { name: 'Tal', x: 480, y: 330 },
  { name: 'Omer', x: 660, y: 380 },
]

/** Which people each layer connects (index pairs into PEOPLE). */
const LAYER_LINKS: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 1], [1, 2], [3, 4]], // astrology — synastry lines
  [[0, 3], [2, 5], [1, 4]], // dreamspell — kin threads
  [[0, 4], [2, 4], [3, 5]], // tzolkin — day-sign resonance
  [[1, 3], [4, 5], [0, 2]], // human design — circuits
  [[0, 5], [1, 5], [2, 3]], // gematria — letter harmonics
]

const LAYER_DASH = ['none', '1 6', '4 4', '10 3', '2 3'] as const

function Layer({
  index,
  progress,
}: {
  readonly index: number
  readonly progress: MotionValue<number>
}) {
  const flavor = SYSTEM_FLAVORS[FLAVOR_DESCENT[index]]
  // Layer i becomes visible in its scroll window and stays.
  const start = index / 6
  const opacity = useTransform(progress, [start, start + 0.09], [0, 1])

  return (
    <motion.g style={{ opacity }}>
      {LAYER_LINKS[index].map(([a, b]) => {
        const pa = PEOPLE[a]
        const pb = PEOPLE[b]
        return (
          <line
            key={`${index}-${a}-${b}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={flavor.accent}
            strokeWidth={1.6}
            strokeDasharray={LAYER_DASH[index]}
            opacity={0.8}
          />
        )
      })}
    </motion.g>
  )
}

export function ZoneLayers() {
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
            : 'sticky top-0 flex min-h-screen flex-col justify-center py-16'
        }
      >
        <div className="mx-auto w-full max-w-content px-6">
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.18em]"
            style={{ borderColor: '#C9A22755', color: '#C9A227', backgroundColor: '#C9A22714' }}
          >
            Layer by layer
          </span>
          <h2 className="mt-6 max-w-3xl font-display text-4xl leading-[1.08] text-white md:text-6xl">
            Same people. Five layers deep.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            Every map and circle in Omnis reads through one system at a time —
            the astrology layer, the dreamspell layer, the tzolkin, the design,
            the letters. Stack all five and read the whole truth at once.
          </p>

          {/* The acetate table */}
          <div className="relative mt-10 rounded-2xl border border-white/10 bg-[#0d101a] p-4 md:p-8">
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
                accent="#C9A227"
                index={5}
                activeIndex={activeIndex}
                forceActive={reducedMotion === true}
              />
            </div>

            <svg viewBox="0 0 800 460" className="h-auto w-full" role="img"
              aria-label="The same six people read through five stacked system layers">
              {/* Fused glow */}
              {reducedMotion ? (
                <rect x={0} y={0} width={800} height={460} fill="#C9A227" opacity={0.06} />
              ) : (
                <motion.rect
                  x={0}
                  y={0}
                  width={800}
                  height={460}
                  fill="#C9A227"
                  style={{ opacity: fusedGlow }}
                />
              )}

              {/* Five acetate layers */}
              {FLAVOR_DESCENT.map((key, i) =>
                reducedMotion ? (
                  <g key={key} opacity={0.8}>
                    {LAYER_LINKS[i].map(([a, b]) => (
                      <line
                        key={`${i}-${a}-${b}`}
                        x1={PEOPLE[a].x}
                        y1={PEOPLE[a].y}
                        x2={PEOPLE[b].x}
                        y2={PEOPLE[b].y}
                        stroke={SYSTEM_FLAVORS[key].accent}
                        strokeWidth={1.6}
                        strokeDasharray={LAYER_DASH[i]}
                        opacity={0.7}
                      />
                    ))}
                  </g>
                ) : (
                  <Layer key={key} index={i} progress={scrollYProgress} />
                ),
              )}

              {/* The people — always present */}
              {PEOPLE.map((p) => (
                <g key={p.name}>
                  <circle cx={p.x} cy={p.y} r={16} fill="#ffffff" opacity={0.08} />
                  <circle cx={p.x} cy={p.y} r={8} fill="#E7D08A" stroke={MURAL_GROUND} strokeWidth={2} />
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

          <p className="mt-6 max-w-xl text-sm text-white/45">
            Isolate any single layer · compare layers side by side · fuse all
            five into one reading, evidence still visible.
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
