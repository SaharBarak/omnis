import {
  calculateFiveSystemCompatibility,
  getPersonKinData,
  CONNECTION_DESCRIPTIONS,
} from '@pleiad/engine/services/compatibility'
import { calculateOracle, getMoonReading } from '@pleiad/engine/calculations'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { DEMO_PEOPLE, type DemoPerson } from '@/lib/data/homepage-demo'
import { SealIcon } from '@/components/cards/SealIcon'
import { MoonGlyph } from '@/components/moon/moon-glyph'
import { cn } from '@/lib/utils'

/**
 * §4b THE COUPLE MAP — the pair view, shown with two demo people whose
 * charts really produce the relations on screen (same honesty rule as the
 * atlas: every value below is engine output, nothing is set-dressed).
 */

const ORACLE_SLOTS = [
  ['guide', 'Guide'],
  ['analog', 'Analog'],
  ['antipode', 'Antipode'],
  ['occult', 'Occult'],
] as const

function DemoOracleStrip({ person, partner }: { person: DemoPerson; partner: DemoPerson }) {
  const kin = getPersonKinData(person.birthDate)
  const partnerKin = getPersonKinData(partner.birthDate)
  const oracle = calculateOracle(kin.kin)

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 flex items-center gap-3">
        <SealIcon sealNumber={kin.seal} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white/90">{person.name}</div>
          <div className="text-xs text-white/50 [font-variant-numeric:tabular-nums]">
            Kin {kin.kin} · {getTone(kin.tone).name} {getSeal(kin.seal).english}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ORACLE_SLOTS.map(([slot, label]) => {
          const slotSeal = oracle[slot]
          const occupied = partnerKin.seal === slotSeal
          return (
            <div
              key={slot}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center',
                occupied ? 'border-brand/60 bg-brand/10' : 'border-white/[0.07]'
              )}
            >
              <SealIcon sealNumber={slotSeal} size="xs" />
              <span className="font-sans text-[9px] font-medium uppercase tracking-[0.12em] text-white/50">
                {label}
              </span>
              <span className={cn('text-[10px]', occupied ? 'text-brand-soft' : 'text-white/35')}>
                {occupied ? partner.name : getSeal(slotSeal).english}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The demo pair: the two people whose charts carry a real oracle relation. */
function pickDemoPair(): [DemoPerson, DemoPerson] {
  let best: [DemoPerson, DemoPerson] = [DEMO_PEOPLE[0], DEMO_PEOPLE[1]]
  let bestCount = -1
  for (let i = 0; i < DEMO_PEOPLE.length; i++) {
    for (let j = i + 1; j < DEMO_PEOPLE.length; j++) {
      const a = DEMO_PEOPLE[i]
      const b = DEMO_PEOPLE[j]
      const aKin = getPersonKinData(a.birthDate)
      const bKin = getPersonKinData(b.birthDate)
      const oracle = calculateOracle(aKin.kin)
      const seats = ORACLE_SLOTS.filter(([slot]) => oracle[slot] === bKin.seal).length
      if (seats > bestCount) {
        bestCount = seats
        best = [a, b]
      }
    }
  }
  return best
}

export function CouplesMap() {
  const [a, b] = pickDemoPair()
  const fusion = calculateFiveSystemCompatibility(
    {
      birthDate: a.birthDate,
      birthTime: a.birthTime,
      birthPlace: { lat: a.lat, lng: a.lng },
      hebrewName: a.hebrewName,
      name: a.name,
    },
    {
      birthDate: b.birthDate,
      birthTime: b.birthTime,
      birthPlace: { lat: b.lat, lng: b.lng },
      hebrewName: b.hebrewName,
      name: b.name,
    }
  )
  const moonA = getMoonReading(a.birthDate)
  const moonB = getMoonReading(b.birthDate)

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-7">
      {/* The two oracles, partner seats lit */}
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <DemoOracleStrip person={a} partner={b} />
        <DemoOracleStrip person={b} partner={a} />
      </div>

      {/* Bonds the engine actually found */}
      {fusion.dreamspellDetail.connections.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {fusion.dreamspellDetail.connections.map((conn) => (
            <span
              key={conn.type}
              className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/70"
            >
              {CONNECTION_DESCRIPTIONS[conn.type].description.split(' - ')[0]}
            </span>
          ))}
        </div>
      )}

      {/* Second row: moons + HD types + score */}
      <div className="mt-6 flex flex-col gap-6 border-t border-white/[0.07] pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          {[
            { person: a, moon: moonA },
            { person: b, moon: moonB },
          ].map(({ person, moon }) => (
            <div key={person.id} className="flex items-center gap-3">
              <MoonGlyph angle={moon.angle} size={40} />
              <div>
                <div className="text-xs text-white/70">{person.name}</div>
                <div className="text-xs text-white/50">{moon.phase}</div>
              </div>
            </div>
          ))}
        </div>
        {fusion.hdDetail?.type1 && fusion.hdDetail.type2 && (
          <div className="text-xs text-white/50">
            {fusion.hdDetail.type1} × {fusion.hdDetail.type2}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
            {fusion.overallScore}
          </span>
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
            resonance
          </span>
        </div>
      </div>
    </div>
  )
}
